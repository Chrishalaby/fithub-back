import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { User } from 'entities/users.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';
import { AccessTokenPayload } from './models/access-token.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly usersSerice: UsersService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  public async validate(accessTokenPayload: AccessTokenPayload): Promise<User> {
    const person: User | null = await this.usersSerice.findOne({
      where: { id: accessTokenPayload.id },
    });

    if (!person) {
      throw new UnauthorizedException();
    }

    return person;
  }
}
