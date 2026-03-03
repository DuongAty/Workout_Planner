import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { USER_CACHE_TTL } from '../common/constants/constants';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: ReturnType<typeof createClient>;

  constructor(private configService: ConfigService) {}

  private createRedisClient() {
    return createClient({
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: this.configService.get<number>('REDIS_PORT'),
      },
      password: this.configService.get<string>('REDIS_PASSWORD') ?? undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    this.client = this.createRedisClient();
    this.client.on('error', (err) => console.error('[Redis]', err));
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl === undefined) {
      await this.client.set(key, value);
      return;
    }
    await this.client.setEx(key, ttl, value);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.client.exists(key);
    return Boolean(count);
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expiresIn);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.exists(`blacklist:${token}`);
  }

  private userCacheKey(userId: string): string {
    return `user:${userId}`;
  }

  async cacheUser<T>(
    userId: string,
    userData: T,
    ttl: number = USER_CACHE_TTL,
  ): Promise<void> {
    await this.set(this.userCacheKey(userId), JSON.stringify(userData), ttl);
  }

  async getCachedUser<T>(userId: string): Promise<T | null> {
    const data = await this.get(this.userCacheKey(userId));
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.del(this.userCacheKey(userId));
  }
}
