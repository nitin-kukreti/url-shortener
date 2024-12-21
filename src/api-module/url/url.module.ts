import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShortUrl } from 'src/entities/short-url.entity';
import { UrlClick } from 'src/entities/url-click.entity';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([ShortUrl, UrlClick]), ConfigModule],
  providers: [UrlService],
  controllers: [UrlController],
})
export class UrlModule {}
