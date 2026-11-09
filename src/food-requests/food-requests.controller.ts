
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../users/entities/user.entity.js';
import { DonorHistoryQueryDto } from '../food-posts/dto/donor-history-query.dto.js';
import { FoodRequestsService } from './food-requests.service.js';

@ApiTags('food-requests')
@ApiBearerAuth()
@Controller('food-requests')
export class FoodRequestsController {
  constructor(private readonly service: FoodRequestsService) {}

  // Receiver browses available food donations
  @Get('available')
  @Roles(UserRole.RECEIVER)
  browseAvailableFood() {
    return this.service.browseAvailableFood();
  }

  // Receiver requests a food donation
  @Post(':postId/request')
  @Roles(UserRole.RECEIVER)
  requestFood(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('id') receiverId: number,
  ) {
    return this.service.requestFood(postId, receiverId);
  }

  // Receiver views their food request history
  @Get('my-history')
  @Roles(UserRole.RECEIVER)
  findReceiverHistory(
    @CurrentUser('id') receiverId: number,
    @Query() query: DonorHistoryQueryDto,
  ) {
    return this.service.findReceiverHistory(receiverId, query);
  }

  // Receiver confirms food delivery
  @Patch(':postId/confirm-delivery')
  @Roles(UserRole.RECEIVER)
  confirmDelivery(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser('id') receiverId: number,
  ) {
    return this.service.confirmDelivery(postId, receiverId);
  }
}
