import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobService } from './job.service';

@Module({
  imports: [
    BullModule.registerQueue(
      {
        name: 'email',
      },
      { name: 'openai' },
    ),
  ],
  providers: [JobService],
  exports: [JobService],
})
export class JobsModule {}
