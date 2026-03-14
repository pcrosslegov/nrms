import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto, LoginDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.displayName);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @Get('config')
  getAuthConfig() {
    const tenantId = this.config.get('AZURE_AD_TENANT_ID');
    const clientId = this.config.get('AZURE_AD_CLIENT_ID');

    return {
      azureAd: tenantId && clientId
        ? {
            enabled: true,
            tenantId,
            clientId,
            redirectUri: this.config.get(
              'AZURE_AD_REDIRECT_URI',
              'http://localhost:5173',
            ),
          }
        : { enabled: false },
      localAuth: { enabled: true },
    };
  }
}
