import { User } from 'entities/users.entity';

export interface AccessTokenPayload extends Partial<User> {
  username: string;
  email: string;
  // firstName: string;
  // lastName: string;
  // avatar: string;
  id: number;
  iat?: number;
  exp?: number;
}

export interface AccessToken {
  accessToken: string;
}
