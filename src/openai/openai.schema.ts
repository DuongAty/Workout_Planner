export const nutritionAnalysisSchema = {
  name: 'nutrition_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['totalCalories', 'protein', 'carbs', 'fat', 'advice'],
    properties: {
      totalCalories: {
        type: 'number',
        description: 'Tổng lượng calo của bữa ăn',
      },
      protein: { type: 'number', description: 'Gam protein' },
      carbs: { type: 'number', description: 'Gam tinh bột' },
      fat: { type: 'number', description: 'Gam chất béo' },
      advice: {
        type: 'string',
        description: 'Lời khuyên ngắn gọn dựa trên thành phần dinh dưỡng',
      },
    },
  },
} as const;
