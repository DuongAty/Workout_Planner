import { AuthProvider } from 'src/enums/user-enum';

export interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name: string;
  picture: string;
  sub: string;
  provider: AuthProvider;
}
export interface SocialUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  provider: AuthProvider;
  providerId: string;
}
