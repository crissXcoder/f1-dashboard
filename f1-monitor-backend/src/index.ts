import { config } from '@/config';
import { createHttpServer } from './server/httpServer';

const { server } = createHttpServer();


server.listen(config.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: Date.now(), level: 'info', msg: 'HTTP server listening', port: config.PORT }));
});

console.log('[BOOT]', {
    port: config.PORT,
    cors: config.CORS_ORIGIN,
    rate: config.RATE_LIMIT_RPS,
    historyMs: config.HISTORY_WINDOW_MS,
    ringCap: config.RING_BUFFER_CAPACITY,
    metrics: config.METRICS_ENABLED,
    env: config.NODE_ENV,
});
