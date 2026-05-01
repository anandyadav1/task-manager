import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { initSocket } from './src/socket/socket.js';
import startOverdueTaskJob from './src/jobs/overdueTask.job.js';

// ─── Environment Validation ─────────────────────────────
const requiredEnvVars = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('   Please check your .env file.');
  process.exit(1);
}

// ─── Server Setup ────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start cron jobs
startOverdueTaskJob();

server.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Team Task Manager API Server');
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/health`);
  console.log('═══════════════════════════════════════════');
});

// ─── Graceful Shutdown ───────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  shutdown('UNHANDLED_REJECTION');
});
