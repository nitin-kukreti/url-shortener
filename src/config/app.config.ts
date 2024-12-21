import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  baseUrl: process.env.BASE_URL,
  throttleTtl: process.env.THROTTLE_TTL,
  throttleLimit: process.env.THROTTLE_LIMIT,
}));
