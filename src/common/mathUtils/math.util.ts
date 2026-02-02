import { NUMBER_CONSTANTS } from "./define_number";

export const WorkoutMath = {
  calculate1RM(weight: number, reps: number): number {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    const value = weight * (1 + 0.0333 * reps);
    return this.round(value);
  },

  calculateVolume(weight: number, reps: number): number {
    return this.round(weight * reps);
  },

  round(value: number, precision: number = 2): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  },

  get1RMSql(weightCol: string, repsCol: string): string {
    return `${weightCol} * (1 + ${NUMBER_CONSTANTS.EPLEY_COEFFICIENT} * ${repsCol})`;
  },

  getVolumeSql(weightCol: string, repsCol: string): string {
    return `${weightCol} * ${repsCol}`;
  },
};
