import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workout } from 'src/workoutplan/workoutplan.entity';

@Injectable()
export class WorkoutReminderService {
  private readonly logger = new Logger(WorkoutReminderService.name);

  constructor(
    @InjectRepository(Workout)
    private readonly workoutRepo: Repository<Workout>,
    private readonly mailerService: MailerService,
  ) {}

  @Cron('0 5 * * *', { timeZone: 'Asia/Ho_Chi_Minh' }) // Chạy lúc 5h sáng
  async sendDailyReminders() {
    // 1. Fix định dạng ngày khớp với Database: YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const workouts = await this.workoutRepo.find({ relations: ['user'] });

    for (const workout of workouts) {
      // So sánh chính xác với chuỗi 'planned' trong JSON
      const hasWorkoutToday = workout.scheduleItems?.find(
        (item) =>
          item.date === todayString && item.status.toLowerCase() === 'planned',
      );

      if (hasWorkoutToday && workout.user?.email) {
        try {
          await this.mailerService.sendMail({
            to: workout.user.email,
            subject: `🚀 SẴN SÀNG CHƯA? Lịch tập ${workout.name.toUpperCase()} hôm nay!`,
            html: this.generateEmailTemplate(workout, todayString),
          });
          this.logger.log(
            `✅ Đã gửi mail chuyên nghiệp cho: ${workout.user.email}`,
          );
        } catch (error) {
          this.logger.error(`❌ Lỗi gửi mail: ${error.message}`);
        }
      }
    }
  }

  // Hàm tạo template HTML chuyên nghiệp
  private generateEmailTemplate(workout: any, date: string): string {
    const primaryColor = '#4F46E5'; // Màu tím xanh hiện đại
    return `
      <div style="background-color: #f3f4f6; padding: 40px 10px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background-color: ${primaryColor}; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">WORKOUT PLANNER</h1>
          </div>
          
          <div style="padding: 30px; color: #1f2937;">
            <h2 style="color: #111827;">Chào ${workout.user.fullname || 'Gymer'}, 💪</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Đã đến lúc phá vỡ giới hạn! Hôm nay, ngày <b>${date}</b>, bạn có một lộ trình tập luyện đã được lên lịch sẵn.
            </p>
            
            <div style="background-color: #f9fafb; border-left: 4px solid ${primaryColor}; padding: 20px; margin: 25px 0;">
              <p style="margin: 0; font-size: 18px;"><b>Chủ đề:</b> ${workout.name}</p>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Số lượng bài tập: ${workout.numExercises} bài</p>
            </div>

            <p style="font-size: 15px; color: #4b5563;">
              Việc duy trì kỷ luật là chìa khóa của thành công. Đừng để những nỗ lực trước đó lãng phí!
            </p>

            <div style="text-align: center; margin-top: 35px;">
              <a href="http://localhost:5173/dashboard" 
                 style="background-color: ${primaryColor}; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                 XEM CHI TIẾT LỊCH TẬP
              </a>
            </div>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">
              © 2026 Workout Planner App. Mọi quyền được bảo lưu.<br>
              Bạn nhận được email này vì đã đăng ký lịch tập trên hệ thống.
            </p>
          </div>
        </div>
      </div>
    `;
  }
}
