import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { PagedResults } from 'src/dtos/common/paged.results.dto';
import { TaskFilterDto } from 'src/dtos/tasks/task.filter.dto';
import { TaskRequestDto } from 'src/dtos/tasks/task.request.dto';
import { CommonResponses } from 'src/helper/common.responses.helper';
import { Task } from 'src/schemas/task.schema';
import { generateId } from 'src/utils';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  constructor(
    @InjectModel(Task.name) private readonly tasksRepository: Model<Task>,
  ) {}

  //get task by id
  async getTaskById(id: string): Promise<ApiResponseDto<Task>> {
    try {
      const task = await this.tasksRepository.findOne({ id }).lean();
      return task
        ? CommonResponses.OkResponse(task)
        : CommonResponses.NotFoundResponse<Task>(
            `Task with id ${id} not found`,
          );
    } catch (error) {
      this.logger.error(
        'An error occurred while gettint task by id',
        id,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Task>();
    }
  }

  //create task
  async createTask(
    task: TaskRequestDto,
    user: UserJwtDetails,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const newTask = await this.tasksRepository.create({
        ...task,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: null,
        updatedby: null,
        createdBy: user.email,
        creatorUserId: user.id,
      });
      const data = await this.tasksRepository.findById(newTask._id).lean();
      this.logger.log('Task created successfully', task, data, user);
      return CommonResponses.CreatedResponse(data);
    } catch (error) {
      this.logger.error('An error occurred while creating task', task, error);
      return CommonResponses.InternalServerErrorResponse<Task>();
    }
  }

  //update task
  async updateTask(
    id: string,
    request: TaskRequestDto,
    user: UserJwtDetails,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const res = await this.tasksRepository
        .findOneAndUpdate(
          { id },
          {
            ...request,
            updatedAt: new Date(),
            updatedby: user.email,
          },
          { new: true },
        )
        .lean();
      if (!res) {
        return CommonResponses.NotFoundResponse<Task>(
          `Task with id ${id} not found`,
        );
      }

      return CommonResponses.OkResponse(res);
    } catch (error) {
      this.logger.error(
        'An error occurred while updating task',
        id,
        request,
        user,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<Task>();
    }
  }

  //delete task
  async deleteTask(
    id: string,
    user: UserJwtDetails,
  ): Promise<ApiResponseDto<Task>> {
    try {
      const res = await this.tasksRepository
        .findOneAndDelete({ $and: [{ id }, { creatorUserId: user.id }] })
        .lean();
      if (!res) {
        return CommonResponses.NotFoundResponse<Task>(
          `Task with id ${id} not found`,
        );
      }
      return CommonResponses.OkResponse(res);
    } catch (error) {
      this.logger.error('An error occurred while deleting task', id, error);
      return CommonResponses.InternalServerErrorResponse<Task>();
    }
  }

  //get all tasks
  async getAllTasks(
    filter: TaskFilterDto,
    user: UserJwtDetails,
  ): Promise<ApiResponseDto<PagedResults<Task>>> {
    try {
      const query = {
        creatorUserId: user.id,
      };
      if (filter.startDate) {
        query['taskDate'] = {
          $gte: filter.startDate,
        };
      }
      if (filter.endDate) {
        query['taskDate'] = {
          $lte: filter.endDate,
        };
      }
      if (filter.status) {
        query['status'] = filter.status;
      }
      if (filter.category) {
        query['category'] = filter.category;
      }

      if (filter.query) {
        query['$or'] = [
          { title: { $regex: filter.query, $options: 'i' } },
          { description: { $regex: filter.query, $options: 'i' } },
          { category: { $regex: filter.query, $options: 'i' } },
        ];
      }

      const totalCount = await this.tasksRepository.countDocuments(query);

      const results = await this.tasksRepository
        .find(query)
        .skip(Math.abs(filter.page - 1) * filter.pageSize)
        .limit(filter.pageSize)
        .sort({ taskDate: 1 })
        .lean();

      const pagedResults: PagedResults<Task> = {
        page: filter.page,
        pageSize: filter.pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / filter.pageSize),
        results,
      };
      this.logger.log('Tasks retrieved successfully', filter, user);
      return CommonResponses.OkResponse(pagedResults);
    } catch (error) {
      this.logger.error(
        'An error occurred while getting all tasks',
        filter,
        user,
        error,
      );
      return CommonResponses.InternalServerErrorResponse<PagedResults<Task>>();
    }
  }
}
