
import 'dotenv/config';

import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { FoodPostsService } from './food-posts.service.js';
import {
  FoodPost,
  FoodPostStatus,
} from './entities/food-posts.entity.js';

import {
  User,
  UserRole,
} from '../users/entities/user.entity.js';

import { StatusHistoryService } from '../status-history/status-history.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UploadsService } from '../uploads/uploads.service.js';

describe.skipIf(process.env.RUN_DB_CONCURRENCY_TEST !== 'true')(
  'FoodPostsService - concurrent acceptance',
  () => {
    let dataSource: DataSource;
    let service: FoodPostsService;

    let donorId: number;
    let volunteerOneId: number;
    let volunteerTwoId: number;
    let foodPostId: number;

    beforeAll(async () => {
      const requiredVariables = [
        'DB_HOST',
        'DB_PORT',
        'DB_USER',
        'DB_PASSWORD',
        'DB_NAME',
      ];

      const missingVariables = requiredVariables.filter(
        (key) => !process.env[key],
      );

      if (missingVariables.length > 0) {
        throw new Error(
          `Missing database environment variables: ${missingVariables.join(', ')}`,
        );
      }

      dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [User, FoodPost],
        synchronize: false,
      });

      await dataSource.initialize();

      const userRepository = dataSource.getRepository(User);

      const uniqueId = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const donor = await userRepository.save(
        userRepository.create({
          name: 'Concurrency Test Donor',
          email: `test-donor-${uniqueId}@example.com`,
          passwordHash: 'test-only-password-hash',
          role: UserRole.DONOR,
          isVerified: true,
          isActive: true,
        }),
      );

      const volunteerOne = await userRepository.save(
        userRepository.create({
          name: 'Concurrency Volunteer One',
          email: `test-volunteer-one-${uniqueId}@example.com`,
          passwordHash: 'test-only-password-hash',
          role: UserRole.VOLUNTEER,
          isVerified: true,
          isActive: true,
        }),
      );

      const volunteerTwo = await userRepository.save(
        userRepository.create({
          name: 'Concurrency Volunteer Two',
          email: `test-volunteer-two-${uniqueId}@example.com`,
          passwordHash: 'test-only-password-hash',
          role: UserRole.VOLUNTEER,
          isVerified: true,
          isActive: true,
        }),
      );

      donorId = donor.id;
      volunteerOneId = volunteerOne.id;
      volunteerTwoId = volunteerTwo.id;

      const foodPostRepository = dataSource.getRepository(FoodPost);

      const foodPost = await foodPostRepository.save(
        foodPostRepository.create({
          donorId,
          title: 'Concurrency Test Food',
          description: 'Temporary food post for concurrency testing',
          foodType: 'Prepared Food',
          portions: 5,
          photoUrl: null,
          photoPublicId: null,
          address: 'Test Address',
          latitude: 23.8103,
          longitude: 90.4125,
          pickupDeadline: new Date(Date.now() + 60 * 60 * 1000),
          status: FoodPostStatus.POSTED,
          acceptedById: null,
          receiverId: null,
        }),
      );

      foodPostId = foodPost.id;

      const statusHistory = {
        log: vi.fn().mockResolvedValue(undefined),
      } as unknown as StatusHistoryService;

      const notifications = {
        create: vi.fn().mockResolvedValue(undefined),
      } as unknown as NotificationsService;

      service = new FoodPostsService(
        dataSource,
        statusHistory,
        notifications,
        {} as UploadsService,
      );
    });

    afterAll(async () => {
      if (dataSource?.isInitialized) {
        if (foodPostId) {
          await dataSource
            .getRepository(FoodPost)
            .delete(foodPostId);
        }

        const userIds = [
          donorId,
          volunteerOneId,
          volunteerTwoId,
        ].filter(Boolean);

        if (userIds.length > 0) {
          await dataSource
            .getRepository(User)
            .delete(userIds);
        }

        await dataSource.destroy();
      }
    });

    it('should allow only one volunteer to accept the same food post', async () => {
      const results = await Promise.allSettled([
        service.acceptFoodPost(foodPostId, {
          id: volunteerOneId,
          role: UserRole.VOLUNTEER,
        }),

        service.acceptFoodPost(foodPostId, {
          id: volunteerTwoId,
          role: UserRole.VOLUNTEER,
        }),
      ]);

      const successfulResults = results.filter(
        (result) => result.status === 'fulfilled',
      );

      const failedResults = results.filter(
        (result) => result.status === 'rejected',
      );

      expect(successfulResults).toHaveLength(1);
      expect(failedResults).toHaveLength(1);

      if (failedResults[0].status === 'rejected') {
        expect(failedResults[0].reason).toBeInstanceOf(
          ConflictException,
        );
      }

      const savedPost = await dataSource
        .getRepository(FoodPost)
        .findOneByOrFail({ id: foodPostId });

      expect(savedPost.status).toBe(FoodPostStatus.ACCEPTED);

      expect([
        volunteerOneId,
        volunteerTwoId,
      ]).toContain(savedPost.acceptedById);
    });
  },
);
