import {
  ConflictException, ForbiddenException, Injectable, UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();

    const exists = await this.users.findOne({ where: { email }, withDeleted: true });
    if (exists) throw new ConflictException('Email already registered');

    const user = await this.users.save(
      this.users.create({
        name: dto.name.trim(),
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        role: dto.role,
        phone: dto.phone,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        
        isVerified: dto.role === UserRole.VOLUNTEER,
      }),
    );

    const tokens = await this.issueTokens(user);
    return { user: this.publicUser(user), ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: dto.email.toLowerCase().trim() })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new ForbiddenException('Account is banned or deactivated');

    const tokens = await this.issueTokens(user);
    return { user: this.publicUser(user), ...tokens };
  }

  // Refresh token rotation:
  async refresh(refreshToken: string) {
    let payload: { sub: number };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.refreshToken')
      .where('u.id = :id', { id: payload.sub })
      .getOne();

    if (!user || !user.isActive || !user.refreshToken || user.refreshToken !== this.sha(refreshToken)) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokens(user);
  }

  async logout(userId: number) {
    await this.users.update(userId, { refreshToken: null });
    return { message: 'Logged out' };
  }

  async me(userId: number) {
    const user = await this.users.findOneOrFail({ where: { id: userId } });
    return {
      ...this.publicUser(user),
      phone: user.phone,
      address: user.address,
      latitude: user.latitude,
      longitude: user.longitude,
    };
  }

  // ---------- helpers ----------
  private async issueTokens(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'],
    });
    const refreshToken = await this.jwt.signAsync(
      { ...payload, jti: randomUUID() }, 
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as JwtSignOptions['expiresIn'],
      },
    );

    await this.users.update(user.id, { refreshToken: this.sha(refreshToken) });
    return { accessToken, refreshToken };
  }

  private sha(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private publicUser(u: User) {
    return { id: u.id, name: u.name, email: u.email, role: u.role, isVerified: u.isVerified };
  }
}