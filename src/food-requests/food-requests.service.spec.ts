import { Test, TestingModule } from '@nestjs/testing';
import { FoodRequestsService } from './food-requests.service.js';

describe('FoodRequestsService', () => {
  let service: FoodRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoodRequestsService],
    }).compile();

    service = module.get<FoodRequestsService>(FoodRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
