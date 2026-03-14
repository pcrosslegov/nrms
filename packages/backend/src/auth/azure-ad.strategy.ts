import { Injectable, Logger, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BearerStrategy } from 'passport-azure-ad';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Only create the strategy class if Azure AD is configured.
// passport-azure-ad throws if identityMetadata is invalid, so we
// use a factory provider in the module instead of a simple @Injectable.

export function createAzureAdStrategy(config: ConfigService, prisma: PrismaService) {
  const tenantId = config.get('AZURE_AD_TENANT_ID');
  const clientId = config.get('AZURE_AD_CLIENT_ID');

  if (!tenantId || !clientId) {
    Logger.log('Azure AD not configured — skipping strategy registration', 'AzureAdStrategy');
    return null;
  }

  @Injectable()
  class AzureAdStrategy extends PassportStrategy(BearerStrategy, 'azure-ad') {
    readonly logger = new Logger(AzureAdStrategy.name);

    constructor() {
      super({
        identityMetadata: `https://login.microsoftonline.com/${tenantId}/v2.0/.well-known/openid-configuration`,
        clientID: clientId,
        audience: clientId,
        validateIssuer: true,
        issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        passReqToCallback: false,
        loggingLevel: 'warn',
      });
    }

    async validate(profile: any) {
      const email = (profile.preferred_username || profile.email || profile.upn || '').toLowerCase();
      const displayName = profile.name || profile.given_name || email;

      if (!email) {
        this.logger.warn('Azure AD token missing email claim');
        return null;
      }

      // Auto-provision user on first login
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            displayName,
            passwordHash: '',
            isActive: true,
          },
        });
        this.logger.log(`Auto-provisioned user: ${email}`);
      }

      if (!user.isActive) {
        return null;
      }

      return { userId: user.id, email: user.email, role: user.role };
    }
  }

  return new AzureAdStrategy();
}
