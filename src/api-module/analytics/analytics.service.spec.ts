import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { ShortUrl } from 'src/entities/short-url.entity';
import { UrlClick } from 'src/entities/url-click.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let userRepository: Repository<User>;
  let shortUrlRepository: Repository<ShortUrl>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            query: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ShortUrl),
          useValue: {
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UrlClick),
          useValue: {
            createQueryBuilder: jest.fn(() => ({
              innerJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              addGroupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn(),
              getRawOne: jest.fn(),
              getCount: jest.fn(),
            })),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:3000'),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    shortUrlRepository = module.get<Repository<ShortUrl>>(
      getRepositoryToken(ShortUrl),
    );
  });

  describe('getTotalUrlsForUser', () => {
    it('should return total URLs count for user', async () => {
      jest.spyOn(shortUrlRepository, 'count').mockResolvedValueOnce(5);

      const result = await service.getTotalUrlsForUser('user-id');

      expect(result).toBe(5);
      expect(shortUrlRepository.count).toHaveBeenCalledWith({
        where: { user: { id: 'user-id' } },
      });
    });
  });

  describe('getTopicStats', () => {
    it('should return topic statistics', async () => {
      const mockStats = [
        {
          TotalCount: '10',
          UniqueClicks: '5',
        },
      ];

      const mockClicksByDate = [
        {
          date: '2024-01-01',
          totalClicks: '3',
        },
      ];

      const mockUrls = [
        {
          shortUrl: 'test-alias',
          totalClicks: '5',
          uniqueClicks: '3',
        },
      ];

      jest
        .spyOn(userRepository, 'query')
        .mockResolvedValueOnce(mockStats)
        .mockResolvedValueOnce(mockClicksByDate)
        .mockResolvedValueOnce(mockUrls);

      const result = await service.getTopicStats('test-topic', 'user-id');

      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('uniqueClicks');
      expect(result).toHaveProperty('clicksByDate');
      expect(result).toHaveProperty('urls');
      expect(userRepository.query).toHaveBeenCalledTimes(3);
    });
  });

  describe('getAnalyticsForShortUrl', () => {
    it('should return URL analytics', async () => {
      const mockTotalClicks = [
        {
          totalClicks: '10',
          uniqueClicks: '5',
        },
      ];

      const mockClicksByDate = [
        {
          date: '2024-01-01',
          clickCount: '3',
        },
      ];

      const mockOsType = [
        {
          osName: 'Windows',
          uniqueClicks: '4',
          uniqueUsers: '3',
        },
      ];

      const mockDeviceType = [
        {
          deviceName: 'Desktop',
          uniqueClicks: '4',
          uniqueUsers: '3',
        },
      ];

      jest
        .spyOn(userRepository, 'query')
        .mockResolvedValueOnce(mockTotalClicks)
        .mockResolvedValueOnce(mockClicksByDate)
        .mockResolvedValueOnce(mockOsType)
        .mockResolvedValueOnce(mockDeviceType);

      const result = await service.getAnalyticsForShortUrl(
        'test-alias',
        'user-id',
      );

      expect(result).toHaveProperty('totalClicks');
      expect(result).toHaveProperty('uniqueClicks');
      expect(result).toHaveProperty('clicksByDate');
      expect(result).toHaveProperty('osType');
      expect(result).toHaveProperty('deviceType');
      expect(userRepository.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('getUserMetricsForUser', () => {
    it('should return aggregated user metrics', async () => {
      jest.spyOn(service, 'getTotalUrlsForUser').mockResolvedValueOnce(5);
      jest.spyOn(service, 'getTotalClicksForUser').mockResolvedValueOnce(10);
      jest.spyOn(service, 'getUniqueClicksForUser').mockResolvedValueOnce(7);
      jest.spyOn(service, 'getClicksByDateForUser').mockResolvedValueOnce([]);
      jest.spyOn(service, 'getOsTypeMetricsForUser').mockResolvedValueOnce([]);
      jest
        .spyOn(service, 'getDeviceTypeMetricsForUser')
        .mockResolvedValueOnce([]);

      const result = await service.getUserMetricsForUser('user-id');

      expect(result).toHaveProperty('totalUrls', 5);
      expect(result).toHaveProperty('totalClicks', 10);
      expect(result).toHaveProperty('uniqueClicks', 7);
      expect(result).toHaveProperty('clicksByDate');
      expect(result).toHaveProperty('osType');
      expect(result).toHaveProperty('deviceType');
    });
  });
});
