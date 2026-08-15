import { JwtPayload } from '../../common/types';

export interface AccessTokenRequest extends Express.Request {
  user: JwtPayload;
}
