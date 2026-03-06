import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly i18n: I18nService,
  ) {}

  @Process('send-email')
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
          `🚀` +
          ready +
          ' ' +
          workout +
          ` ${workoutName.toUpperCase()} ` +
          today +
          '!',
        template: 'workout-reminder',
        context: {
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

  @Process('send-register-email')
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

  @Process('send-workout-analysis')
  async handleSendWorkoutAnalysis(job: Job) {
    const { to, subject, template, context } = job.data;
    try {
      this.logger.log(`[Queue] Đang xử lý job ${job.name} gửi đến: ${to}`);
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(`[Queue] ✅ Gửi mail thành công cho: ${to}`);
    } catch (error) {
      this.logger.error(`[Queue] ❌ Lỗi gửi mail: ${error.message}`);
      throw error;
    }
  }
}
