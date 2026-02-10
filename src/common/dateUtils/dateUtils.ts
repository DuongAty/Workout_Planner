import { BadRequestException } from '@nestjs/common';

export const DateUtils = {
  getStartOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  getEndOfDay(date: string | Date): Date {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  },

  generateScheduleDays(
    startDate: string,
    endDate: string,
    daysOfWeek: number[],
  ) {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (daysOfWeek.includes(d.getDay())) {
        dates.push(d.toISOString().split('T')[0]);
      }
    }
    return dates;
  },
};

export const checkDateRange = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    throw new BadRequestException(
      'The start date must be earlier than the end date.',
    );
  }
};
