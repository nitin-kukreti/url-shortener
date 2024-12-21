import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UrlParamsDto {
  @ApiProperty()
  @IsString()
  alias: string;
}
