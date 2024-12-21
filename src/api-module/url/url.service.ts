import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { ShortUrl } from 'src/entities/short-url.entity';
import { UrlClick } from 'src/entities/url-click.entity';
import { RedisService } from 'src/shared/redis/redis.service';
import { Repository } from 'typeorm';
import * as useragent from 'useragent';
import { CreateUrlDto } from './dto/create-url.dto';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Injectable()
export class UrlService {
  private readonly logger = new Logger(UrlService.name);

  constructor(
    @InjectRepository(ShortUrl)
    private readonly shortUrlRepository: Repository<ShortUrl>,
    @InjectRepository(UrlClick)
    private readonly urlClickRepository: Repository<UrlClick>,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('URL service initialized');
  }

  /**
   * Handles shortened URL retrieval, caching, and click logging.
   * @param alias The alias of the shortened URL.
   * @param req The HTTP request object (to capture user information).
   * @returns The long URL for redirection.
   */
  async getShortenUrl(alias: string, req: Request): Promise<string> {
    const client = this.redisService.getClient();

    try {
      // Check Redis cache for alias
      const cachedUrl = await client.get(alias);
      if (cachedUrl) {
        this.logger.log(`Cache hit for alias: ${alias}`);
        const obj: ShortUrl = JSON.parse(cachedUrl);
        this.collectAnalyticData(req, obj.id);
        return obj.longUrl;
      }

      // Fetch from database if not in cache
      const dbResult = await this.shortUrlRepository.findOne({
        where: { alias: alias },
      });

      if (!dbResult) {
        this.logger.warn(`Alias not found: ${alias}`);
        throw new NotFoundException('Invalid URL');
      }
      this.collectAnalyticData(req, dbResult.id);
      // Cache the result in Redis with expiration (e.g., 1 hour)
      await client.set(alias, JSON.stringify(dbResult), 'EX', 3600);

      this.logger.log(`Alias resolved and cached: ${alias}`);
      return dbResult.longUrl;
    } catch (error) {
      this.logger.error(`Error resolving alias: ${alias}`, error.stack);
      throw error;
    }
  }

  /**
   * Handles shortened URL creation
   * @param data The alias of the shortened URL.
   * @param userId The HTTP request object (to capture user information).
   * @returns The long URL for redirection.
   */
  async createShortUrl(data: CreateUrlDto, userId: string) {
    this.logger.log(data, userId);
    const { customAlias, longUrl, topic } = data;

    // Use customAlias if provided or generate a random one
    const aliasNano = customAlias || nanoid();

    // Check if the customAlias already exists in the database
    if (customAlias) {
      const check = await this.shortUrlRepository.count({
        where: { alias: aliasNano },
      });

      if (check) {
        throw new ConflictException('Alias already exists');
      }
    }

    // Create the new ShortUrl entity
    const shortUrl = this.shortUrlRepository.create({
      alias: aliasNano,
      longUrl,
      topic,
      user: { id: userId },
    });

    // Save it to the database
    const { alias, createdAt } = await this.shortUrlRepository.save(shortUrl);

    // Return the created ShortUrl object or alias
    const shortUrlPath = this.getShortenUrlFromAlias(alias);
    return {
      shortUrl: shortUrlPath,
      createdAt,
    };
  }

  private async collectAnalyticData(req: Request, id: string): Promise<void> {
    this.logger.log(req.headers);
    const agent = useragent.parse(req.headers['user-agent']);
    const osType = agent.os.toString();
    const deviceType = agent.device.toString();
    const ipAddress =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    this.logger.log(ipAddress);
    const urlClick = this.urlClickRepository.create({
      shortUrl: { id: id },
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      userAgent: req.headers['user-agent'],
      osType: osType,
      deviceType: deviceType,
    });

    // Save the click data to the database with out waiting
    this.urlClickRepository.save(urlClick);
  }

  async list(userId: string) {
    const result = await this.shortUrlRepository.find({
      select: ['alias', 'longUrl', 'createdAt'],
      where: { user: { id: userId } },
    });
    return result.map(({ alias, ...rest }) => {
      const shortUrlPath = this.getShortenUrlFromAlias(alias);
      return { shortUrl: shortUrlPath, ...rest };
    });
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
