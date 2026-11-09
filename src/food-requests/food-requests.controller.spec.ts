import { Test, TestingModule } from '@nestjs/testing';
import { FoodRequestsController } from './food-requests.controller.js';

describe('FoodRequestsController', () => {
  let controller: FoodRequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoodRequestsController],
    }).compile();

    controller = module.get<FoodRequestsController>(FoodRequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
