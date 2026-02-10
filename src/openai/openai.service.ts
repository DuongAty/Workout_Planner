import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { nutritionAnalysisSchema } from './openai.schema';
import { nutritionPrompt } from '../nutrition/promt/nutrition.prompt';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async chat(prompt: string): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional fitness coach. Return ONLY pure JSON. No markdown, no backticks, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      });

      let content = response.choices[0].message.content || '';
      content = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      try {
        const parsedData = JSON.parse(content);
        return parsedData;
      } catch (parseError) {
        console.error('Errors parse JSON:', content);
        throw new InternalServerErrorException(
          'AI response was not valid JSON format',
        );
      }
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new InternalServerErrorException('Failed to connect to OpenAI');
    }
  }

  async analyzeFood(foodDescription: string): Promise<any> {
    try {
      const prompt = nutritionPrompt(foodDescription);
      const response = await this.openai.chat.completions.parse({
        model: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Bạn là chuyên gia dinh dưỡng. Hãy phân tích thành phần dinh dưỡng từ mô tả của người dùng.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: nutritionAnalysisSchema,
        },
      });

      return response.choices[0].message.parsed;
    } catch (error) {
      throw new InternalServerErrorException(
        'Không thể phân tích đồ ăn: ' + error.message,
      );
    }
  }
}
