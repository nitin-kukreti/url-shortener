import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @ApiProperty()
  @IsUrl()
  longUrl: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  customAlias: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  topic: string;
}
