import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { LoginRequest } from 'src/dtos/auth/login.request.dto';
import { UserJwtDetails } from 'src/dtos/auth/user.jwt.details';
import { CreateUserRequest } from 'src/dtos/user/create.user.request.dto';
import { AuthUser } from 'src/extensions/auth.extensions';
import { JwtAuthGuard } from 'src/providers/jwt-auth..guard';
import { AuthService } from 'src/services/auth.service';

@Controller('api/authentication')
@ApiTags('Authentication')
@ApiBearerAuth('Authorization')
export class AuthenticationController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() req: LoginRequest, @Res() response: Response) {
    const res = await this.authService.login(req);
    response.status(res.code).send(res);
  }

  //profile
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@AuthUser() user: UserJwtDetails, @Res() response: Response) {
    const res = await this.authService.getProfile(user);
    response.status(res.code).send(res);
  }

  //logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@AuthUser() user: UserJwtDetails, @Res() response: Response) {
    const res = await this.authService.logout(user);
    response.status(res.code).send(res);
  }

  //register
  @Post('register')
  async register(@Body() req: CreateUserRequest, @Res() response: Response) {
    const res = await this.authService.register(req);
    response.status(res.code).send(res);
  }
}
