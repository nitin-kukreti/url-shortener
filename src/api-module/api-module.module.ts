import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UrlModule } from './url/url.module';

@Module({
  imports: [AnalyticsModule, AuthModule, UrlModule],
})
export class ModuleAPi {}
