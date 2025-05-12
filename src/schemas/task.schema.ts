import { Prop, Schema } from '@nestjs/mongoose';
import { BaseSchema } from '.';
import { TaskStatus } from 'src/enums';
import { ApiProperty } from '@nestjs/swagger';

@Schema()
export class Task extends BaseSchema {
  @Prop({ required: true })
  @ApiProperty()
  title: string;

  @Prop({ required: true })
  @ApiProperty()
  description: string;

  @Prop({ required: true })
  @ApiProperty()
  taskDate: Date;

  @Prop({ required: true })
  @ApiProperty()
  taskTime: string;

  @Prop({ default: null })
  @ApiProperty()
  duration?: number;

  @Prop({ default: TaskStatus.Pending })
  @ApiProperty()
  status: TaskStatus;

  @Prop({ default: null })
  @ApiProperty()
  category?: string;

  @Prop({ required: true })
  @ApiProperty()
  creatorUserId: string;
}
