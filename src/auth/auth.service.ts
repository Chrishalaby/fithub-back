import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'entities/users.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/create-auth.dto';
import { EmailDto } from './dto/email.dto';
import { AccessToken, AccessTokenPayload } from './models/access-token.model';

@Injectable()
export class AuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly personRepository: Repository<User>,
  ) {}

  async jwtLogin(loginDetails: LoginDto): Promise<AccessToken> {
    const person: User | null = await this.usersService.findOne({
      where: { username: loginDetails.username },
    });

    if (!person) {
      throw new NotFoundException();
    }

    if (person && person.password === loginDetails.password) {
      const payload: AccessTokenPayload = {
        username: person?.username,
        email: person?.email,
        // firstName: person?.firstName,
        // lastName: person?.lastName,
        // avatar: person?.avatar,
        id: person?.id,
      };

      return {
        accessToken: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException({
      error: 'Invalid Credentials',
    });
  }

  public async sendResetPasswordEmail(emailDto: EmailDto): Promise<void> {
    const person: User | null = await this.usersService.findOne({
      where: { email: emailDto.email },
    });

    if (!person) {
      throw new NotFoundException({
        error: 'Invalid Email',
      });
    }
    if (person) {
      const payload: AccessTokenPayload = {
        username: person?.username,
        email: person?.email,
        // firstName: person?.firstName,
        // lastName: person?.lastName,
        // avatar: person?.avatar,
        id: person?.id,
      };

      const token = this.jwtService.sign(payload);

      try {
        const url = `${this.configService.get(
          'DOMAIN',
        )}/auth/reset-password/${token}`;
        await this.mailerService.sendMail({
          to: person.email,
          from: 'no-reply@inventorie.com',
          subject: 'Reset Password',
          html: `
        <p>Hey ${person.username || person.email},</p>
        <p>We heard that you forgot your password. Sorry about that!</p>
        <p>But don't worry! You can use the following link to reset your password:</p>
        <a href=${url}>Reset your password here</a>
        <p>Please notice that the link will expire within 1 hour!</p>`,
        });
      } catch (error) {
        throw new InternalServerErrorException({
          error: error.message,
        });
      }

      return;
    }
  }

  public async resetPassword(
    user: AccessTokenPayload,
    newPassword: string,
  ): Promise<AccessToken> {
    try {
      const person: User | null = await this.usersService.findOne({
        where: { username: user.username },
      });
      if (!person) {
        throw new NotFoundException();
      }
      const updatedPerson = this.personRepository.merge(person, {
        password: newPassword,
      });
      await this.personRepository.save(updatedPerson);

      const payload: AccessTokenPayload = {
        username: updatedPerson?.username,
        email: updatedPerson?.email,
        // firstName: updatedPerson?.firstName,
        // lastName: updatedPerson?.lastName,
        // avatar: person?.avatar,
        id: updatedPerson?.id,
      };

      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch (error) {
      if (error.status === '404') {
        throw new NotFoundException();
      }

      throw new InternalServerErrorException();
    }
  }
}
