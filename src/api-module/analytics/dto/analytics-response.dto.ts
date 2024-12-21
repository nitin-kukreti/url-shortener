import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AnalyticTopic {
  @ApiProperty()
  @IsString()
  topic: string;
}

export class AnalyticAlias {
  @ApiProperty()
  @IsString()
  alias: string;
}
