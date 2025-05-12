import { ApiProperty } from '@nestjs/swagger';
import { BaseFilter } from '../common/base.filter.dto';

export class TaskFilterDto extends BaseFilter {
  @ApiProperty({ required: false })
  startDate?: Date;

  @ApiProperty({ required: false })
  endDate?: Date;

  @ApiProperty()
  duration?: number;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  category?: string;
}
