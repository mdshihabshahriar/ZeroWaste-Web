import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module.js';
import { ReceiverProfilesModule } from './receiver-profiles/receiver-profiles.module.js';
import { AuditLogsModule } from './audit-logs/audit-logs.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,    
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,                    
    }),
    UsersModule,
    ReceiverProfilesModule,
    AuditLogsModule,
    AuthModule,
  ],
})
export class AppModule {}