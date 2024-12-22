import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from './url.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CreateUrlDto } from './dto/create-url.dto';
import { Request } from 'express';
import { ShortUrl } from '../../entities/short-url.entity';
import { UrlClick } from '../../entities/url-click.entity';
import { RedisService } from '../../shared/redis/redis.service';

describe('UrlService', () => {
  let service: UrlService;
  let shortUrlRepository: Repository<ShortUrl>;

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        {
          provide: getRepositoryToken(ShortUrl),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UrlClick),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: () => mockRedisClient,
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

    service = module.get<UrlService>(UrlService);
    shortUrlRepository = module.get<Repository<ShortUrl>>(
      getRepositoryToken(ShortUrl),
    );
  });

  describe('getShortenUrl', () => {
    const mockRequest = {
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1',
      },
      connection: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    it('should return cached URL if exists', async () => {
      const mockShortUrl = {
        id: '1',
        longUrl: 'http://example.com',
      };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockShortUrl));

      const result = await service.getShortenUrl('test-alias', mockRequest);

      expect(result).toBe(mockShortUrl.longUrl);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test-alias');
    });

    it('should fetch and cache URL if not in cache', async () => {
      const mockShortUrl = {
        id: '1',
        longUrl: 'http://example.com',
      };
      mockRedisClient.get.mockResolvedValueOnce(null);
      jest
        .spyOn(shortUrlRepository, 'findOne')
        .mockResolvedValueOnce(mockShortUrl as ShortUrl);

      const result = await service.getShortenUrl('test-alias', mockRequest);

      expect(result).toBe(mockShortUrl.longUrl);
      expect(shortUrlRepository.findOne).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException for invalid alias', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      jest.spyOn(shortUrlRepository, 'findOne').mockResolvedValueOnce(null);

      await expect(
        service.getShortenUrl('invalid-alias', mockRequest),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createShortUrl', () => {
    const createUrlDto: CreateUrlDto = {
      longUrl: 'http://example.com',
      customAlias: 'custom-alias',
      topic: 'test-topic',
    };

    it('should create short URL with custom alias', async () => {
      jest.spyOn(shortUrlRepository, 'count').mockResolvedValueOnce(0);
      jest.spyOn(shortUrlRepository, 'create').mockReturnValueOnce({
        alias: 'custom-alias',
        longUrl: 'http://example.com',
      } as ShortUrl);
      jest.spyOn(shortUrlRepository, 'save').mockResolvedValueOnce({
        alias: 'custom-alias',
        createdAt: new Date(),
      } as ShortUrl);

      const result = await service.createShortUrl(createUrlDto, 'user-id');

      expect(result).toHaveProperty('shortUrl');
      expect(result).toHaveProperty('createdAt');
      expect(shortUrlRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate alias', async () => {
      jest.spyOn(shortUrlRepository, 'count').mockResolvedValueOnce(1);

      await expect(
        service.createShortUrl(createUrlDto, 'user-id'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('list', () => {
    it('should return list of user URLs', async () => {
      const mockUrls = [
        {
          alias: 'test1',
          longUrl: 'http://example1.com',
          createdAt: new Date(),
        },
        {
          alias: 'test2',
          longUrl: 'http://example2.com',
          createdAt: new Date(),
        },
      ];

      jest
        .spyOn(shortUrlRepository, 'find')
        .mockResolvedValueOnce(mockUrls as ShortUrl[]);

      const result = await service.list('user-id');

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('shortUrl');
      expect(result[0]).toHaveProperty('longUrl');
      expect(shortUrlRepository.find).toHaveBeenCalledWith({
        select: ['alias', 'longUrl', 'createdAt'],
        where: { user: { id: 'user-id' } },
      });
    });
  });
});
