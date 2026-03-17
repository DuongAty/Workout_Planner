import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { NameMailJobEnum, NameOpenAIJobEnum } from 'src/enums/name-job-enum';
import { JobEnum } from 'src/enums/job-enum';

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
    return this.emailQueue.add(NameMailJobEnum.SEND_EMAIL, data, {
      attempts: JobEnum.ATTEMPTS,
      backoff: JobEnum.BACKOFF,
      removeOnComplete: true,
    });
  }
  async addOpenAIJobWorkout(data: {
    prompt: string;
    userId?: string;
    type?: string;
    lang?: string;
  }) {
    return this.openaiQueue.add(
      NameOpenAIJobEnum.OPEN_AI_WORKOUT_GENERATE,
      data,
      {
        attempts: JobEnum.ATTEMPTS,
        backoff: JobEnum.BACKOFF,
        removeOnComplete: true,
      },
    );
  }

  async addOpenAIJobWorkoutStatistics(data: {
    userId?: string;
    type?: string;
  }) {
    return this.openaiQueue.add(
      NameOpenAIJobEnum.OPEN_AI_WORKOUT_STATISTICS_GENERATE,
      data,
      {
        attempts: JobEnum.ATTEMPTS,
        backoff: JobEnum.BACKOFF,
        removeOnComplete: true,
      },
    );
  }

  async addOpenAIJobCalo(data: {
    userId?: string;
    prompt: string;
    type?: string;
    lang?: string;
  }) {
    return this.openaiQueue.add(NameOpenAIJobEnum.OPEN_AI_CALO_GENERATE, data, {
      attempts: JobEnum.ATTEMPTS,
      backoff: JobEnum.BACKOFF,
      removeOnComplete: true,
    });
  }

  async addRegisterEmailJob(data: {
    email: string;
    fullname: string;
    lang: string;
  }) {
    return this.emailQueue.add(NameMailJobEnum.SEND_REGISTER_EMAIL, data, {
      attempts: JobEnum.ATTEMPTS,
      backoff: JobEnum.BACKOFF,
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
    lang: string;
  }) {
    return this.emailQueue.add(
      NameMailJobEnum.SEND_WORKOUT_CREATED_EMAIL,
      data,
      {
        attempts: JobEnum.ATTEMPTS,
        backoff: JobEnum.BACKOFF,
        removeOnComplete: true,
      },
    );
  }

  async addSendEmailJob(data: any) {
    return this.emailQueue.add(NameMailJobEnum.SEND_ANALYSIS_EMAIL, data, {
      attempts: JobEnum.ATTEMPTS,
      backoff: JobEnum.BACKOFF,
      removeOnComplete: true,
    });
  }
}
