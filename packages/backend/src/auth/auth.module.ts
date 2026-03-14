import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { createAzureAdStrategy } from './azure-ad.strategy';
import { PrismaService } from '../prisma/prisma.service';

const AzureAdStrategyProvider = {
  provide: 'AZURE_AD_STRATEGY',
  inject: [ConfigService, PrismaService],
  useFactory: (config: ConfigService, prisma: PrismaService) => {
    return createAzureAdStrategy(config, prisma);
  },
};

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'dev-secret'),
        signOptions: { expiresIn: config.get('JWT_EXPIRY', '24h') },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, AzureAdStrategyProvider],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
