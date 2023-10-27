import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';
import { EmailDto } from './dto/email.dto';
import { ResetCredentialsDto } from './dto/reset-credentials.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AccessToken, AccessTokenPayload } from './models/access-token.model';

interface RequestWithUser extends Request {
  user: AccessTokenPayload;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiUnauthorizedResponse({ description: 'wrong credentials' })
  @ApiBadRequestResponse({ description: 'validation error' })
  @ApiAcceptedResponse({ description: 'successful login' })
  @HttpCode(202)
  @Post('login')
  public async login(@Body() loginDetails: LoginDto): Promise<AccessToken> {
    return this.authService.jwtLogin(loginDetails);
  }

  @HttpCode(204)
  @Get('reset-password/:email')
  public async sendResetPasswordEmail(
    @Param() emailDto: EmailDto,
  ): Promise<void> {
    return this.authService.sendResetPasswordEmail(emailDto);
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  public resetPassword(
    @Req() req: RequestWithUser,
    @Body() resetCredentialsDto: ResetCredentialsDto,
  ): Promise<AccessToken> {
    return this.authService.resetPassword(
      req.user,
      resetCredentialsDto.password,
    );
  }
}
