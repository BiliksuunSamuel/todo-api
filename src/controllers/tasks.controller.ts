import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { TaskFilterDto } from 'src/dtos/tasks/task.filter.dto';
import { TaskRequestDto } from 'src/dtos/tasks/task.request.dto';
import { AuthUser } from 'src/extensions/auth.extensions';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { TaskService } from 'src/services/task.service';

@Controller('api/tasks')
@ApiTags('Tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Get(':id')
  @ApiParam({ name: 'id', required: true })
  async getTaskById(@Param('id') id: string, @Res() response: Response) {
    const res = await this.taskService.getTaskById(id);
    response.status(res.code).send(res);
  }

  @Get()
  async getTasks(
    @Query() filter: TaskFilterDto,
    @AuthUser() user: UserJwtDetails,
    @Res() response: Response,
  ) {
    const res = await this.taskService.getAllTasks(filter, user);
    response.status(res.code).send(res);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', required: true })
  async updateTask(
    @Param('id') id: string,
    @Res() response: Response,
    @AuthUser() user: UserJwtDetails,
    @Body() request: TaskRequestDto,
  ) {
    const res = await this.taskService.updateTask(id, request, user);
    response.status(res.code).send(res);
  }

  @Post()
  async createTask(
    @Body() task: TaskRequestDto,
    @AuthUser() user: UserJwtDetails,
    @Res() response: Response,
  ) {
    const res = await this.taskService.createTask(task, user);
    response.status(res.code).send(res);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', required: true })
  async deleteTask(
    @Param('id') id: string,
    @Res() response: Response,
    @AuthUser() user: UserJwtDetails,
  ) {
    const res = await this.taskService.deleteTask(id, user);
    response.status(res.code).send(res);
  }
}
