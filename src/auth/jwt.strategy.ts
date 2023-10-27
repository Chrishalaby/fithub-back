import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Person } from 'entities/person.entity';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PersonService } from 'src/person/person.service';
import { AccessTokenPayload } from './models/access-token.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  public constructor(
    private readonly personService: PersonService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  public async validate(
    accessTokenPayload: AccessTokenPayload,
  ): Promise<Person> {
    const person: Person | null = await this.personService.findOne({
      where: { id: accessTokenPayload.id },
    });

    if (!person) {
      throw new UnauthorizedException();
    }

    return person;
  }
}
