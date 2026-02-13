import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Request,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  Patch,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import { UpdateRoleDto } from '../request/dto/update-role.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'Find all users',
  })
  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAllUsers();

    if (!users || users.length === 0) {
      throw new NotFoundException('User not found');
    }

    return users;
  }

  @Patch('/role')
  @ApiOperation({
    summary: 'Update user role by user ID',
  })
  updateRole(
    @Body() roleUpdate: UpdateRoleDto,
    @Request() req: RequestWithCookies,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const user = decoded as BackendJwtPayload;

      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (user.role !== 'Admin' && user.role !== 'IT') {
        throw new ForbiddenException(
          'You do not have permission to update roles',
        );
      }

      return this.userService.updateRole(roleUpdate.id, roleUpdate.role);
    } catch (error) {
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Create user',
  })
  async createUser(@Body() userDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.userService.createUser(userDto);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Patch('me/gitlab-url')
  @ApiOperation({
    summary: 'Add or update GitLab URL for the authenticated user',
  })
  async updateGitlabUrl(
    @Body('gitlabUrl') gitlabUrl: string,
    @Request() req: RequestWithCookies,
  ) {
    const token = req.cookies?.['access_token'];
    if (!token) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as BackendJwtPayload;

      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (
        decoded.role !== 'Admin' &&
        decoded.role !== 'IT' &&
        decoded.role !== 'Developer'
      ) {
        throw new ForbiddenException(
          'You do not have permission to update GitLab URL',
        );
      }

      return this.userService.addGitlabUrl(decoded.id, gitlabUrl);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('me/gitlab-url')
  @ApiOperation({
    summary: 'Get GitLab URL for the authenticated user',
  })
  async getGitlabUrl(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (!token) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as BackendJwtPayload;

      if (!decoded || !decoded.email) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.userService.getGitlabUrl(decoded.id);
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('by-email')
  @ApiOperation({
    summary: 'Find users by email',
  })
  async findByEmail(
    @Query() query: FindUserByEmailDto,
  ): Promise<UserResponseDto> {
    const { email } = query;
    const users: User | null = await this.userService.findByEmail(email);

    if (!users) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return users;
  }

  @Get('fuzzy-find-by-email')
  @ApiOperation({
    summary: 'Fuzzy find users by email',
  })
  async fuzzyFindUsersByEmail(
    @Query() query: FindUserByEmailDto,
  ): Promise<UserResponseDto[]> {
    const { email } = query;

    const users = await this.userService.fuzzyFindUsersByEmail(email);

    if (!users || users.length === 0) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return users;
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get all requests for the authenticated user',
  })
  findRequestsForUser(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];

    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const user = decoded as BackendJwtPayload;
      return this.userService.findByEmail(user.email ?? '');
    } catch (err) {
      console.error('User Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
