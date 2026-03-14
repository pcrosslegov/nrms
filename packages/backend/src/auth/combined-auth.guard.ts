import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CombinedAuthGuard extends AuthGuard(['jwt', 'azure-ad']) {
  private strategies: string[];

  constructor(private config: ConfigService) {
    super();
    // Only include azure-ad if configured
    const azureConfigured = !!config.get('AZURE_AD_TENANT_ID');
    this.strategies = azureConfigured ? ['jwt', 'azure-ad'] : ['jwt'];
  }

  getAuthenticateOptions() {
    return { strategies: this.strategies };
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    // If any strategy succeeded, allow
    if (user) return user;
    // If all failed, throw the first error
    return super.handleRequest(err, user, info, context, status);
  }
}
