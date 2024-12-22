import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { join } from 'path';
import { ShortUrl } from 'src/entities/short-url.entity';
import { UrlClick } from 'src/entities/url-click.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AnalyticsService {
  private logger = new Logger(AnalyticsService.name);
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepository: Repository<ShortUrl>,
    @InjectRepository(UrlClick)
    private readonly urlClickRepository: Repository<UrlClick>,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('service is initilize');
  }

  // Total URLs created by the user
  async getTotalUrlsForUser(userId: string): Promise<number> {
    return await this.shortUrlRepository.count({
      where: { user: { id: userId } },
    });
  }

  // Total Clicks across all URLs
  async getTotalClicksForUser(userId: string): Promise<number> {
    const result = await this.urlClickRepository
      .createQueryBuilder('url_click')
      .innerJoin('url_click.shortUrl', 'short_url')
      .where('short_url.userId = :userId', { userId })
      .getCount();

    return result;
  }

  // Total Unique Clicks (unique users per user)
  async getUniqueClicksForUser(userId: string): Promise<number> {
    const query = await this.urlClickRepository
      .createQueryBuilder('url_click')
      .innerJoin('url_click.shortUrl', 'short_url')
      .where('short_url.userId = :userId', { userId })
      .select('COUNT(DISTINCT url_click.ipAddress)', 'uniqueClicks');

    const result = await query.getRawOne();

    return parseInt(result.uniqueClicks, 10);
  }

  // Clicks by Date
  async getClicksByDateForUser(userId: string): Promise<any[]> {
    const result = await this.urlClickRepository
      .createQueryBuilder('url_click')
      .innerJoin('url_click.shortUrl', 'short_url')
      .where('short_url.userId = :userId', { userId })
      .select('DATE(url_click.createdAt)', 'date')
      .addSelect('COUNT(*)', 'clicks')
      .groupBy('date')
      .getRawMany();

    return result.map((record) => ({
      date: record.date,
      totalClicks: parseInt(record.clicks),
    }));
  }

  // OS Type Metrics (unique clicks and unique users per OS)
  async getOsTypeMetricsForUser(userId: string): Promise<any[]> {
    const result = await this.urlClickRepository
      .createQueryBuilder('url_click')
      .innerJoin('url_click.shortUrl', 'short_url')
      .where('short_url.userId = :userId', { userId })
      .select('url_click.osType', 'osType')
      .addSelect('COUNT(DISTINCT url_click.ipAddress)', 'uniqueClicks')
      .addSelect('COUNT(DISTINCT url_click.userAgent)', 'uniqueUsers')
      .groupBy('url_click.osType')
      .addGroupBy('url_click.ipAddress')
      .getRawMany();

    return result.map((record) => ({
      osName: record.osType,
      uniqueClicks: parseInt(record.uniqueClicks),
      uniqueUsers: parseInt(record.uniqueUsers),
    }));
  }

  // Device Type Metrics (unique clicks and unique users per device)
  async getDeviceTypeMetricsForUser(userId: string): Promise<any[]> {
    const result = await this.urlClickRepository
      .createQueryBuilder('url_click')
      .innerJoin('url_click.shortUrl', 'short_url')
      .where('short_url.userId = :userId', { userId })
      .select('url_click.deviceType', 'deviceType')
      .addSelect('COUNT(DISTINCT url_click.ipAddress)', 'uniqueClicks')
      .addSelect('COUNT(DISTINCT url_click.userAgent)', 'uniqueUsers')
      .groupBy('url_click.deviceType')
      .addGroupBy('url_click.ipAddress')
      .getRawMany();

    return result.map((record) => ({
      deviceName: record.deviceType,
      uniqueClicks: parseInt(record.uniqueClicks),
      uniqueUsers: parseInt(record.uniqueUsers),
    }));
  }

  // Aggregated User Metrics
  async getUserMetricsForUser(userId: string) {
    const totalUrls = await this.getTotalUrlsForUser(userId);
    const totalClicks = await this.getTotalClicksForUser(userId);
    const uniqueClicks = await this.getUniqueClicksForUser(userId);
    const clicksByDate = await this.getClicksByDateForUser(userId);
    const osTypeMetrics = await this.getOsTypeMetricsForUser(userId);
    const deviceTypeMetrics = await this.getDeviceTypeMetricsForUser(userId);

    return {
      totalUrls,
      totalClicks,
      uniqueClicks,
      clicksByDate,
      osType: osTypeMetrics,
      deviceType: deviceTypeMetrics,
    };
  }

  async getTopicStats(topic: string, userId: string) {
    // Query 1: Get total count and unique clicks
    const totalStatsQuery = await this.userRepository.query(
      `
      SELECT 
        COUNT(1) AS "TotalCount",
        COUNT(DISTINCT url_clicks."ipAddress") AS "UniqueClicks"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.topic = $1
        AND short_urls."userId" = $2
        ;
    `,
      [topic, userId],
    );

    const totalCount = totalStatsQuery[0].TotalCount;
    const uniqueClicks = totalStatsQuery[0].UniqueClicks;

    // Query 2: Get clicks by date
    const clicksByDateQuery = await this.userRepository.query(
      `
      SELECT 
        DATE(url_clicks."createdAt") AS date,
        COUNT(url_clicks.id) AS "totalClicks"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.topic = $1
        AND short_urls."userId" = $2

      GROUP BY 
        DATE(url_clicks."createdAt");
    `,
      [topic, userId],
    );

    // Query 3: Get URLs under the topic
    const urlsQuery = await this.userRepository.query(
      `
      SELECT 
        short_urls.alias AS "shortUrl",
        COUNT(url_clicks.id) AS "totalClicks",
        COUNT(DISTINCT url_clicks."ipAddress") AS "uniqueClicks"
      FROM 
        short_urls
      LEFT JOIN  url_clicks  ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.topic = $1
        AND short_urls."userId" = $2
      GROUP BY 
        short_urls.alias;
    `,
      [topic, userId],
    );

    // Combine all results into a single object
    const result = {
      totalCount: totalCount ?? 0,
      uniqueClicks: uniqueClicks ?? 0,
      clicksByDate: clicksByDateQuery.map((row) => ({
        date: row.date,
        totalClicks: row.totalClicks,
      })),
      urls: urlsQuery.map((row) => ({
        shortUrl: this.getShortenUrlFromAlias(row.shortUrl),
        totalClicks: row.totalClicks,
        uniqueClicks: row.uniqueClicks,
      })),
    };

    return result;
  }

  async getAnalyticsForShortUrl(alias: string, userId: string) {
    // Query 1: Total Clicks and Unique Clicks
    const totalClicksQuery = await this.userRepository.query(
      `
      SELECT
        COUNT(1) AS "totalClicks",
        COUNT(DISTINCT url_clicks."ipAddress") AS "uniqueClicks"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.alias = $1
        AND short_urls."userId" = $2;

    `,
      [alias, userId],
    );

    const totalClicks = totalClicksQuery[0].totalClicks;
    const uniqueClicks = totalClicksQuery[0].uniqueClicks;

    // Query 2: Clicks by Date (Last 7 days)
    const clicksByDateQuery = await this.userRepository.query(
      `
      SELECT
        DATE(url_clicks."createdAt") AS "date",
        COUNT(url_clicks.id) AS "clickCount"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.alias = $1
        AND url_clicks."createdAt" >= NOW() - INTERVAL '7 days'
        AND short_urls."userId" = $2

      GROUP BY 
        DATE(url_clicks."createdAt")
      ORDER BY 
        date DESC;
    `,
      [alias, userId],
    );

    // Query 3: OS Type Breakdown
    const osTypeQuery = await this.userRepository.query(
      `
      SELECT 
        url_clicks."osType" AS "osName",
        COUNT(DISTINCT url_clicks."ipAddress") AS "uniqueClicks",
        COUNT(1) AS "uniqueUsers"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.alias = $1
        AND short_urls."userId" = $2
      GROUP BY 
        url_clicks."osType";
    `,
      [alias, userId],
    );

    // Query 4: Device Type Breakdown
    const deviceTypeQuery = await this.userRepository.query(
      `
      SELECT 
        url_clicks."deviceType" AS "deviceName",
        COUNT(DISTINCT url_clicks."ipAddress") AS "uniqueClicks",
        COUNT(1) AS "uniqueUsers"
      FROM 
        url_clicks
      INNER JOIN short_urls ON short_urls.id = url_clicks."shortUrlId"
      WHERE 
        short_urls.alias = $1
      GROUP BY 
        url_clicks."deviceType";
    `,
      [alias],
    );

    // Combine all results into a single object
    const result = {
      totalClicks: totalClicks ?? 0,
      uniqueClicks: uniqueClicks ?? 0,
      clicksByDate: clicksByDateQuery.map((row) => ({
        date: row.date,
        clickCount: row.clickCount ?? 0,
      })),
      osType: osTypeQuery.map((row) => ({
        osName: row.osName,
        uniqueClicks: row.uniqueClicks ?? 0,
        uniqueUsers: row.uniqueUsers ?? 0,
      })),
      deviceType: deviceTypeQuery.map((row) => ({
        deviceName: row.deviceName,
        uniqueClicks: row.uniqueClicks ?? 0,
        uniqueUsers: row.uniqueUsers ?? 0,
      })),
    };

    return result;
  }

  private getShortenUrlFromAlias(alias: string): string {
    const shortUrlPath = join(
      this.configService.get('app.baseUrl'),
      'shorten',
      alias,
    );
    return shortUrlPath;
  }
}
