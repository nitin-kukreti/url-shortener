import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from 'src/api-module/auth/auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private logger = new Logger(GoogleStrategy.name);
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      clientID: configService.get('google.clientID'),
      clientSecret: configService.get('google.clientSecret'),
      callbackURL: configService.get('google.callbackURL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile) {
    this.logger.log(accessToken);
    this.logger.log(refreshToken);
    this.logger.log(profile);
    const user = await this.authService.validateUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
    });

    if (user) {
      const jwtToken = this.authService.generateJwtToken({
        displayName: user.name,
        email: user.email,
        id: user.id,
      });
      return { user, accessToken: jwtToken };
    }
    this.logger.log('Validate');
    this.logger.log(user);
    return user || null;
  }
}
