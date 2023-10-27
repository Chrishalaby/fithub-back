import { Person } from 'entities/person.entity';

export interface AccessTokenPayload extends Partial<Person> {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  id: number;
  iat?: number;
  exp?: number;
}

export interface AccessToken {
  accessToken: string;
}
