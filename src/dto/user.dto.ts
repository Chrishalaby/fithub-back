export class UserDto {
  id: number;
  username: string;
  email: string;
  userType?: string;
  aiRequestToken: number;
  trainerId?: number;
  subscriptionId?: string;
}
