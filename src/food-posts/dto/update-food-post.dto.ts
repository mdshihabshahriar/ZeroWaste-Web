import { PartialType } from '@nestjs/swagger';
import { CreateFoodPostDto } from './create-food-post.dto.js';
 
export class UpdateFoodPostDto extends PartialType(CreateFoodPostDto) {}