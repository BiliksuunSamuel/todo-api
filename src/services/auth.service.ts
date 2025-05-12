import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthResponse } from 'src/dtos/auth/auth.response.dto';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { ApiResponseDto } from 'src/dtos/common/api.response.dto';
import { CreateUserRequest } from 'src/dtos/user/create.user.request.dto';
import { UserResponse } from 'src/dtos/user/user.response.dto';
import { CommonResponses } from 'src/helper/common.responses.helper';
import { User } from 'src/schemas/user.schema';
import {
  comparePassword,
  generateId,
  hashPassword,
  toUserResponse,
} from 'src/utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User.name) private readonly userRepository: Model<User>,
    private readonly jwtService: JwtService,
  ) {}

  //validate user
  async validateUser(useranme: string): Promise<User> {
    try {
      const user = await this.userRepository
        .findOne({ email: useranme })
        .lean();
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error('an error occurred while validating user', error);
      return null;
    }
  }

  async login(request: LoginRequest): Promise<ApiResponseDto<AuthResponse>> {
    try {
      let user = await this.userRepository
        .findOne({ email: request.email })
        .lean();
      if (!user) {
        return CommonResponses.UnauthorizedResponse<AuthResponse>(
          'Incorrect email address or password',
        );
      }

      const passwordMatch = await comparePassword(
        request.password,
        user.password,
      );
      if (!passwordMatch) {
        return CommonResponses.UnauthorizedResponse<AuthResponse>(
          'Incorrect email address or password',
        );
      }

      const authTokenId = generateId();
      user.updatedAt = new Date();
      user.tokenIds = [...user.tokenIds, authTokenId];
      user.updatedBy = user.email;
      user.updatedAt = new Date();
      const { _id, ...others } = user as any;
      await this.userRepository.findOneAndUpdate(
        { email: user.email },
        {
          ...others,
        },
      );

      const payload: UserJwtDetails = {
        id: user.id,
        email: user.email,
        tokenId: authTokenId,
      };
      const data = {
        user: toUserResponse({
          ...user,
        }),
        token: await this.jwtService.signAsync(payload),
      };
      return CommonResponses.OkResponse(data);
    } catch (error) {
      this.logger.error('an error occurred during user login', error, request);
      return CommonResponses.InternalServerErrorResponse<AuthResponse>();
    }
  }

  //log out
  async logout(authUser: UserJwtDetails): Promise<ApiResponseDto<string>> {
    try {
      const user = await this.userRepository
        .findOne({ email: authUser.email })
        .lean();
      if (!user) {
        return CommonResponses.UnauthorizedResponse<string>('User not found');
      }
      const tokenIds = user.tokenIds.filter(
        (tokenId) => tokenId !== authUser.tokenId,
      );
      await this.userRepository.findOneAndUpdate(
        { email: authUser.email },
        {
          tokenIds,
          updatedAt: new Date(),
          updatedBy: user.email,
        },
      );
      return CommonResponses.OkResponse('logged out successfully');
    } catch (error) {
      this.logger.error(
        'an error occurred during user logout',
        error,
        authUser,
      );
      return CommonResponses.InternalServerErrorResponse<string>();
    }
  }

  //register
  async register(
    request: CreateUserRequest,
  ): Promise<ApiResponseDto<AuthResponse>> {
    try {
      const emailUser = await this.userRepository
        .findOne({ email: request.email })
        .lean();
      if (emailUser) {
        return CommonResponses.ConflictResponse<AuthResponse>(
          'Email already exists',
        );
      }
      const authTokenId = generateId();
      const doc = await this.userRepository.create({
        ...request,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
        tokenIds: [authTokenId],
        password: await hashPassword(request.password),
        createdBy: request.email,
        updatedBy: request.email,
        authenticated: true,
      });
      const data = await this.userRepository.findById(doc._id).lean();
      const tokenPayload: UserJwtDetails = {
        email: request.email,
        id: doc.id,
        tokenId: authTokenId,
      };
      const token = await this.jwtService.signAsync(tokenPayload);
      const response = {
        user: toUserResponse({
          ...data,
        }),
        token,
      };
      return CommonResponses.CreatedResponse(response);
    } catch (error) {
      this.logger.error(
        'an error occurred during user registration',
        error,
        request,
      );
      return CommonResponses.InternalServerErrorResponse<AuthResponse>();
    }
  }

  //get profile
  async getProfile(
    authUser: UserJwtDetails,
  ): Promise<ApiResponseDto<UserResponse>> {
    try {
      const user = await this.userRepository
        .findOne({ email: authUser.email })
        .lean();
      if (!user) {
        return CommonResponses.UnauthorizedResponse<UserResponse>(
          'User not found',
        );
      }
      const data = toUserResponse({
        ...user,
      });
      return CommonResponses.OkResponse(data);
    } catch (error) {
      this.logger.error('an error occurred while getting user profile', error);
      return CommonResponses.InternalServerErrorResponse<UserResponse>();
    }
  }
}
