import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TaskStatus } from 'src/enums';

export class TaskRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  taskDate: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  taskTime: string;

  @ApiProperty()
  duration?: number;

  @ApiProperty()
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  status: string;

  @ApiProperty()
  category?: string;
}
