import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/decorators/user.decorator';
import { OptionsDTO } from 'src/dto/options.dto';
import { UserDto } from 'src/dto/user.dto';
import { WorkoutPlanTrainerDto } from 'src/dto/workoutPlanTrainerI.dto';
import { JwtAuthGuard } from '../auth/local-auth.guard';
import { OpenAiService } from './open-ai.service';

@UseGuards(JwtAuthGuard)
@Controller('open-ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Get('/workout-options')
  findAll(): Promise<OptionsDTO[]> {
    return this.openAiService.findAll();
  }

  @Post('/workout-plan')
  async createWorkoutPlan(
    @User() user: UserDto,
    @Body() workoutPlanDto: WorkoutPlanTrainerDto,
  ) {
    const userId = user.id;

    const prompt = `As my personal trainer, based on this information: ${JSON.stringify(
      workoutPlanDto,
    )} please create a custom workout plan for me.`;
    const response = await this.openAiService.createWorkoutPlan(userId, prompt);
    return response;
  }

  @Post('/meal-plan')
  async createMealPlan(@User() user: UserDto, @Body() mealPlanDto: any) {
    const userId = user.id;

    const prompt = `As my nutritionist, based on this information: ${JSON.stringify(
      mealPlanDto,
    )} please create a custom meal plan for me.`;
    const response = await this.openAiService.createMealPlan(userId, prompt);
    return response;
  }

  @Post('/create-checkout-session')
  async createSession(
    @Req() req: Request,
    @Body('priceId') priceId: string,
    @Body('subscriptionType') subscriptionType: string,
  ) {
    if (!priceId) {
      console.log('priceId didnt work');
      throw new HttpException(
        'priceId is required and must be a string',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const session = await this.openAiService.createCheckoutSession(
        priceId,
        `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        subscriptionType,
      );
      return { clientSecret: session.client_secret }; // Return the clientSecret for the frontend to use
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('session-status')
  async getSessionStatus(
    @Query('session_id') sessionId: string,
    @User() user: UserDto,
  ) {
    const userId = user.id;

    if (!sessionId) {
      throw new HttpException('Session ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const session = await this.openAiService.retrieveSession(sessionId);
      console.log(session);
      // Check if the session is complete and the mode is 'payment'
      if (session.status === 'complete' && session.mode === 'payment') {
        // Add 5 tokens to the user's account
        await this.openAiService.addTokensToUser(userId, 5);
      }

      if (
        session.status === 'complete' &&
        session.mode === 'subscription' &&
        session.subscription === 'string'
      ) {
        // Update the user's subscription
        await this.openAiService.updateUserSubscription(
          userId,
          session.subscription,
        );
      }

      return {
        status: session.status,
        customer_email: session.customer_details?.email,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('subscription-status')
  async getSubscriptionStatus(@Query('subscriptionId') subscriptionId: string) {
    try {
      const subscription =
        await this.openAiService.retrieveSubscription(subscriptionId);
      return { status: subscription.status };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
