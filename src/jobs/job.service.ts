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
    lang: string;
  }) {
    return this.emailQueue.add('send-email', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }
  async addOpenAIJobWorkout(data: {
    prompt: string;
    userId?: string;
    type?: string;
  }) {
    return this.openaiQueue.add('openai-workout-generate', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }

  async addOpenAIJobWorkoutStatistics(data: {
    userId?: string;
    type?: string;
  }) {
    return this.openaiQueue.add('openai-workout-statistics-generate', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }

  async addOpenAIJobCalo(data: {
    userId?: string;
    prompt: string;
    type?: string;
  }) {
    return this.openaiQueue.add('openai-calo-generate', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }

  async addRegisterEmailJob(data: {
    email: string;
    fullname: string;
    lang: string;
  }) {
    return this.emailQueue.add('send-register-email', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }

  async addWorkoutCreatedEmailJob(data: {
    email: string;
    fullname: string;
    name: string;
    startDate: string;
    endDate: string;
    numExercises: number;
    estimatedCalories: number;
    link: string;
  }) {
    return this.emailQueue.add('send-workout-created-email', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }

  async addSendEmailJob(data: any) {
    return this.emailQueue.add('send-analysis-email', data, {
      attempts: 3,
      backoff: 5000,
      removeOnComplete: true,
    });
  }
}
