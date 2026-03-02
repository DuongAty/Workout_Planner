import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService implements OnModuleInit {
  constructor(private configService: ConfigService) {}
  onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          this.configService.get('FIREBASE_URL') || {},
        ),
      });
    }
  }

  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
    try {
      const message = {
        notification: { title, body },
        token: fcmToken,
        data: data || {},
      };
      await admin.messaging().send(message);
      console.log('Successfully sent notification');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}
