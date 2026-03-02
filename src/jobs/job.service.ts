import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue('email')
    private readonly emailQueue: Queue,
    @InjectQueue('openai')
    private readonly openaiQueue: Queue,
  ) {}

  async addEmailJob(data: {
    email: string;
    fullname: string;
    workoutName: string;
    date: string;
    numExercises: number;
    url: string;
  }) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }
  async addOpenAIJob(data: { prompt: string; userId?: string; type?: string }) {
    return this.openaiQueue.add('openai-generate', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }
}
