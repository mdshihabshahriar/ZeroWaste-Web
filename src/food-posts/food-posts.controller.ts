import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js'; 
import { UserRole } from '../users/entities/user.entity.js';
import { imageUploadOptions } from '../uploads/image-upload.options.js';
import { CreateFoodPostDto } from './dto/create-food-post.dto.js';
import { DonorHistoryQueryDto } from './dto/donor-history-query.dto.js';
import { UpdateFoodPostDto } from './dto/update-food-post.dto.js';
import { FoodPostsService } from './food-posts.service.js';
import { NearbyFoodPostsQueryDto } from './dto/nearby-food-posts-query.dto.js';
 
type AuthUser = { id: number; role: UserRole };
 
@ApiTags('food-posts')
@ApiBearerAuth()
@Controller('food-posts')
export class FoodPostsController {
  constructor(private readonly service: FoodPostsService) {}
 
  @Post()
  @Roles(UserRole.DONOR)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateFoodPostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.create(user, dto, file);
  }
 
  @Get('my')
  @Roles(UserRole.DONOR)
  findMine(@CurrentUser() user: AuthUser, @Query() query: DonorHistoryQueryDto) {
    return this.service.findMine(user.id, query);
  }

  
@Get('nearby')
@Roles(UserRole.VOLUNTEER)
findNearby(@Query() query: NearbyFoodPostsQueryDto) {
  return this.service.findNearby(query);
}

 
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.findOne(id, user);
  }
 
  @Patch(':id')
  @Roles(UserRole.DONOR)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo', imageUploadOptions))
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateFoodPostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.update(id, user, dto, file);
  }
 
  @Patch(':id/cancel')
  @Roles(UserRole.DONOR)
  cancel(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.service.cancel(id, user);
  }
}
