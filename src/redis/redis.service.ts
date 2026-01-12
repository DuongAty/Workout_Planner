import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      socket: {
        host: this.configService.get('REDIS_HOST'),
        port: this.configService.get('REDIS_PORT'),
      },
      password: this.configService.get('REDIS_PASSWORD') || undefined,
    });
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.client.setEx(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', expiresIn);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.exists(`blacklist:${token}`);
  }

  async cacheUser(
    userId: string,
    userData: any,
    ttl: number = 3600,
  ): Promise<void> {
    await this.set(`user:${userId}`, JSON.stringify(userData), ttl);
  }

  async getCachedUser(userId: string): Promise<any | null> {
    const data = await this.get(`user:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.del(`user:${userId}`);
  }
}
