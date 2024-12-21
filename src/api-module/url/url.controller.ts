import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { UrlService } from './url.service';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { CreateUrlDto } from './dto/create-url.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { UrlParamsDto } from './dto/url.dto';

@ApiTags('shorten')
@Controller('shorten')
export class UrlController {
  constructor(private urlService: UrlService) {}
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Post('/')
  async shortenUrl(@Body() data: CreateUrlDto, @Req() req: Request) {
    const result = await this.urlService.createShortUrl(
      data,
      (req.user as { userId: string }).userId,
    );
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @Get('/')
  async urlLists(@Req() req: Request) {
    return await this.urlService.list((req.user as { userId: string }).userId);
  }

  @ApiExcludeEndpoint()
  @SkipThrottle()
  @Get(':alias')
  async redirectUrl(
    @Req() req: Request,
    @Res() res: Response,
    @Param() { alias }: UrlParamsDto,
  ) {
    const url = await this.urlService.getShortenUrl(alias, req);
    return res.redirect(url);
  }
}
