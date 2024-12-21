import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AnalyticAlias, AnalyticTopic } from './dto/analytics-response.dto';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}
  @Get('overall')
  async getOverAllAnalytics(@Req() req) {
    return await this.analyticsService.getUserMetricsForUser(req.user.userId);
  }

  @Get('topic/:topic')
  async getTopicAnalytics(@Param() { topic }: AnalyticTopic) {
    return await this.analyticsService.getTopicStats(topic);
  }

  @Get(':alias')
  async getAliasAnalytics(@Param() { alias }: AnalyticAlias) {
    return await this.analyticsService.getAnalyticsForShortUrl(alias);
  }
}
