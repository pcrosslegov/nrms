import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as passport from 'passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Check if azure-ad strategy is registered
    const strategies = ['jwt'];
    try {
      (passport as any)._strategy('azure-ad');
      strategies.push('azure-ad');
    } catch {
      // azure-ad strategy not registered, use jwt only
    }

    if (strategies.length > 1) {
      // Try both strategies — succeed if either works
      const req = context.switchToHttp().getRequest();
      const res = context.switchToHttp().getResponse();

      return new Promise<boolean>((resolve, reject) => {
        passport.authenticate(strategies, { session: false }, (err: any, user: any) => {
          if (err) return reject(err);
          if (!user) return reject(new UnauthorizedException());
          req.user = user;
          resolve(true);
        })(req, res);
      });
    }

    return super.canActivate(context);
  }
}
