import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity.js';

export interface JwtUser {
  id: number;
  email: string;
  role: UserRole;
}

export const CurrentUser = createParamDecorator(
  (field: keyof JwtUser | undefined, ctx: ExecutionContext) => {
    const user = ctx.switchToHttp().getRequest().user as JwtUser;
    return field ? user?.[field] : user;
  },
);