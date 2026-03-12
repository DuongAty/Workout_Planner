export const JWT_STRATEGY = 'jwt';
export const JWT_EXPIRES_IN = 3600;
export const USERNAME_NOT_FOUND_MESSAGE = 'Username not found';
export const PASSWORD_INCORRECT_MESSAGE = 'Password is incorrect';
export enum ConfigKey {
  JWT_SECRET = 'JWT_SECRET',
}
export const USER_CACHE_TTL = 3600;
export const ACCESS_TOKEN_TTL = '1d';
export const REFRESH_TOKEN_TTL = '7d';
export const ACCESS_TOKEN_BLACKLIST_TTL = 15 * 60;
export const THROTTLER_TTL = 60000;
export const THROTTLER_LIMIT = 20;

export const NEED_TRY = 'Needs to try harder.';
export const GOOD_PROGRESS = 'Good progress';
export const NO_ENOUGH_DATA = 'Not enough data';
export const MAX_TIME = 600;
export const MIN_TIME = 60;
export const MAX_LENGHT = 100;
export const MIN_LENGHT_USER = 8;
export const MAX_LENGHT_USER = 20;

export const trim = ({ value }) =>
  typeof value === 'string' ? value.trim() : value;

export const passwordVal =
  /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
export const EVERY_MONTH = '0 0 1 * *';
