import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { LoginDto } from 'src/dto/Login.dto';
import { UserDto } from 'src/dto/user.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ accessToken: string; user: UserDto }> {
    const { accessToken, user } = await this.authService.login(loginDto);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        userType: user.userType,
        aiRequestToken: user.aiRequestToken,
        subscriptionId: user.subscriptionId,
      },
    };
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(email);
    return {
      message:
        'If a user with that email exists, a password reset email has been sent.',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  async changePassword(
    @User() user: UserDto,
    @Body() body: { newPassword: string },
  ) {
    const userId = user.id;
    await this.authService.changePassword(userId, body.newPassword);
  }
}
