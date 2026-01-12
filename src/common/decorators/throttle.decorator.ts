import { Throttle } from '@nestjs/throttler';

export const AuthThrottle = () =>
  Throttle({
    default: {
      limit: 5,
      ttl: 60000,
    },
  });

export const WEThrottle = () =>
  Throttle({
    default: {
      limit: 10,
      ttl: 60000,
    },
  });
