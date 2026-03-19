import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { NameMailJobEnum } from 'src/enums/name-job-enum';
import { head } from 'axios';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  @Process(NameMailJobEnum.SEND_EMAIL)
  async handleSendEmail(job: Job) {
    const { email, fullname, workoutName, date, numExercises, url, lang } =
      job.data;

    try {
      const [
        ready,
        workout,
        hello,
        today,
        remid,
        workout_name,
        num_Exercises,
        ex,
        desdescription,
        link,
      ] = await Promise.all([
        this.i18n.t('common.emailRemider.ready', { lang }),
        this.i18n.t('common.emailRemider.workout', { lang }),
        this.i18n.t('common.emailRemider.hello', { lang }),
        this.i18n.t('common.emailRemider.today', { lang }),
        this.i18n.t('common.emailRemider.remid', { lang }),
        this.i18n.t('common.emailRemider.workout_name', { lang }),
        this.i18n.t('common.emailRemider.num_Exercises', { lang }),
        this.i18n.t('common.emailRemider.ex', { lang }),
        this.i18n.t('common.emailRemider.desdescription', { lang }),
        this.i18n.t('common.emailRemider.link', { lang }),
      ]);
      await this.mailerService.sendMail({
        to: email,
        subject:
          `🚀 ` +
          ready +
          ' ' +
          workout +
          ` ${workoutName.toUpperCase()} ` +
          today +
          '!',
        template: 'workout-reminder',
        context: {
          headerTitle: 'Nhắc Nhở Lịch Tập',
          fullname,
          date,
          workoutName,
          numExercises,
          url,
          ready,
          workout,
          hello,
          today,
          remid,
          workout_name,
          num_Exercises,
          ex,
          desdescription,
          link,
        },
      });

      this.logger.log(`✅ Sent email to ${email}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send email to ${email}`);
      throw error;
    }
  }

  @Process(NameMailJobEnum.SEND_REGISTER_EMAIL)
  async handleRegisterEmail(job: Job) {
    const { email, fullname, lang } = job.data;
    try {
      const [
        subject,
        welcome,
        hello,
        welcome_text,
        welcome_text2,
        login,
        contact,
        desdescription,
      ] = await Promise.all([
        this.i18n.t('common.registration.subject', { lang }),
        this.i18n.t('common.registration.welcome', { lang }),
        this.i18n.t('common.registration.hello', { lang }),
        this.i18n.t('common.registration.welcome_text', { lang }),
        this.i18n.t('common.registration.welcome_text2', { lang }),
        this.i18n.t('common.registration.login', { lang }),
        this.i18n.t('common.registration.contact', { lang }),
        this.i18n.t('common.registration.desdescription', { lang }),
      ]);
      await this.mailerService.sendMail({
        to: email,
        subject: '🎉 ' + subject,
        template: 'register',
        context: {
          headerTitle: 'Đăng Ký',
          welcome,
          hello,
          welcome_text,
          welcome_text2,
          login,
          contact,
          desdescription,
          fullname,
          email,
          loginUrl: `${process.env.FRONTEND_URL}/login`,
        },
      });

      this.logger.log(`Sent register email to ${email}`);
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  @Process(NameMailJobEnum.SEND_WORKOUT_ANALYSIS)
  async handleSendWorkoutAnalysis(job: Job) {
    const { to, subject, template, context } = job.data;
    try {
      this.logger.log(`[Queue] Đang xử lý job ${job.name} gửi đến: ${to}`);
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          headerTitle: 'Phân tích tập luyện chuyên sâu',
          ...context,
        },
      });
      this.logger.log(`[Queue] ✅ Gửi mail thành công cho: ${to}`);
    } catch (error) {
      this.logger.error(`[Queue] ❌ Lỗi gửi mail: ${error.message}`);
      throw error;
    }
  }
  @Process(NameMailJobEnum.SEND_WORKOUT_CREATED_EMAIL)
  async handleWorkoutCreatedEmail(job: Job) {
    const {
      email,
      fullname,
      name,
      startDate,
      endDate,
      numExercises,
      estimatedCalories,
      link,
      lang,
    } = job.data;
    try {
      const [
        subject,
        title,
        hello,
        head_description,
        start_Date,
        end_Date,
        num_Exercises,
        calories,
        ex,
        footer_description,
        details,
      ] = await Promise.all([
        this.i18n.t('common.create.subject', { lang }),
        this.i18n.t('common.create.title', { lang }),
        this.i18n.t('common.create.hello', { lang }),
        this.i18n.t('common.create.head_description', { lang }),
        this.i18n.t('common.create.start_Date', { lang }),
        this.i18n.t('common.create.end_Date', { lang }),
        this.i18n.t('common.create.num_Exercises', { lang }),
        this.i18n.t('common.create.calories', { lang }),
        this.i18n.t('common.create.ex', { lang }),
        this.i18n.t('common.create.footer_description', { lang }),
        this.i18n.t('common.create.details', { lang }),
      ]);
      this.logger.log(`[Queue] Đang xử lý job ${job.name} gửi đến: ${email}`);
      await this.mailerService.sendMail({
        to: email,
        subject: subject + ' 💪',
        template: 'workout-created',
        context: {
          headerTitle: 'Lịch Tập Luyện',
          fullname,
          name,
          startDate,
          endDate,
          numExercises,
          estimatedCalories,
          link,
          title,
          hello,
          head_description,
          start_Date,
          end_Date,
          num_Exercises,
          calories,
          ex,
          footer_description,
          details,
        },
      });
      this.logger.log(`Workout created email sent to ${email}`);
    } catch (error) {
      this.logger.error(`[Queue] ❌ Lỗi gửi mail: ${error.message}`);
      throw error;
    }
  }

  @Process(NameMailJobEnum.SEND_WORKOUT_MONTHLY)
  async processSendMail(job: Job) {
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context: {
          headerTitle: 'Báo cáo tháng',
          ...context,
        },
      });
      this.logger.log(`Đã gửi báo cáo tháng thành công tới: ${to}`);
    } catch (error) {
      this.logger.error(`Lỗi gửi mail: ${error.message}`);
      throw error;
    }
  }
}
