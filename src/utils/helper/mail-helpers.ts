export const MailHelpers = {
  formatMinutes: (seconds: number): number => {
    if (!seconds || isNaN(seconds)) return 0;
    return Math.round(seconds / 60);
  },
  roundNumber: (num: number): number => {
    if (!num || isNaN(num)) return 0;
    return Math.round(num);
  },
  translateLevel: (level: string): string => {
    if (!level) return 'Chưa xác định';
    const levels: Record<string, string> = {
      low: 'Thấp',
      medium: 'Trung bình',
      high: 'Cao',
    };
    return levels[level.toLowerCase()] || level;
  },
  formatDate: (date: string | Date): string => {
    return new Date(date).toLocaleDateString('vi-VN');
  },
};
