import logger from '@/lib/logger/src';
import { ApiAdapterClient } from './client';

export const apiClient = new ApiAdapterClient({
  logger: process.env.NODE_ENV === 'production' ? logger : undefined,
});

export * from './api-error-response';
export * from './api-response';
export * from './api-success-response';
export * from './client';
export * from './response-metadata';

