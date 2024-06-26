import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { Options } from 'src/entites/option.entity';
import { Users } from 'src/entites/users.entity';
import Stripe from 'stripe';
import { Repository } from 'typeorm';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;
  private stripe: Stripe;
  constructor(
    @InjectRepository(Options)
    private optionsRepository: Repository<Options>,

    @InjectRepository(Users)
    private userRepository: Repository<Users>,

    private configService: ConfigService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
      organization: this.configService.get<string>('OPENAI_ORG'),
    });

    this.stripe = new Stripe(
      'sk_test_51P1tkOCgNLrByVR9Tps2YF6KjUS8m3a8TPrxqk9aKR1jVgZvrr4cuhDDZ33nRfsmahSg4rAvoiQwEMpfyuAVPSlK00TRwtRLc5',
      {
        apiVersion: '2023-10-16',
      },
    );
  }

  async findAll(): Promise<Options[]> {
    // Should return an array of Option entities
    return this.optionsRepository.find();
  }

  async createWorkoutPlan(
    userId: number,
    messageContent: string,
  ): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (user?.aiRequestToken && user?.aiRequestToken > 0) {
      try {
        user.aiRequestToken -= 1;
        await this.userRepository.save(user);
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a personal trainer.',
            },
            {
              role: 'user',
              content: messageContent,
            },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        });
        return completion.choices[0].message.content;
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw error;
      }
    }
  }

  async createMealPlan(userId: number, messageContent: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    if (user?.aiRequestToken && user?.aiRequestToken > 0) {
      try {
        user.aiRequestToken -= 1;
        await this.userRepository.save(user);
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a nutritionist.',
            },
            {
              role: 'user',
              content: messageContent,
            },
          ],
          max_tokens: 4096,
          temperature: 0.7,
        });
        return completion.choices[0].message.content;
      } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw error;
      }
    }
  }

  async createCheckoutSession(
    priceId: string,
    returnUrl: string,
    subscriptionType: string,
  ) {
    const mode: Stripe.Checkout.SessionCreateParams.Mode = [
      'payment',
      'subscription',
      'setup',
    ].includes(subscriptionType)
      ? (subscriptionType as Stripe.Checkout.SessionCreateParams.Mode)
      : 'payment'; // Default to 'payment' if an invalid subscriptionType is provided

    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode,
      ui_mode: 'embedded',
      return_url: returnUrl,
    });
  }

  async retrieveSession(sessionId: string) {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  async retrieveSubscription(subscriptionId: string) {
    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async updateUserSubscription(
    userId: number,
    subscriptionId: string,
  ): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.subscriptionId = subscriptionId;
      await this.userRepository.save(user);
      return user.subscriptionId; // Return updated subscription ID
    }
    return 'error updating subscription ID';
  }

  async addTokensToUser(userId: number, tokensToAdd: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      user.aiRequestToken = user.aiRequestToken
        ? user.aiRequestToken + tokensToAdd
        : tokensToAdd;
      await this.userRepository.save(user);
      return user.aiRequestToken; // Return updated token count
    }
    return 0;
  }
}
