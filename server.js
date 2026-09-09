const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/appError');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Mount API Routes
app.use('/api', routes);

// Handle unknown routes
app.all('*', (req, res, next) => {
  next(
    new AppError(
      `Cannot find endpoint '${req.method} ${req.originalUrl}' on this server.`,
      404,
      'NOT_FOUND'
    )
  );
});

// Centralized Error Handling Middleware
app.use(errorHandler);

let server = null;

const startServer = async () => {
  try {
    // Establish database connection
    await connectDB();

    // Auto-seed initial demo data if database is empty
    const Branch = require('./models/Branch');
    const branchCount = await Branch.countDocuments();
    if (branchCount === 0) {
      console.log('[Server] Database is empty. Auto-seeding initial demo data...');
      const seedData = require('./scripts/seed');
      await seedData(false);
    }

    server = app.listen(env.port, () => {
      console.log(
        `==================================================\n` +
        `  Restaurant Table Reservation & Ordering System  \n` +
        `  Phase 1 Backend Active                         \n` +
        `  Environment: ${env.nodeEnv}                    \n` +
        `  Port:        ${env.port}                       \n` +
        `  Health:      http://localhost:${env.port}/api/health\n` +
        `==================================================`
      );
    });
  } catch (error) {
    console.error('[CRITICAL] Failed to initialize server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[CRITICAL] Unhandled Rejection:', err.name, err.message);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('Process terminated.');
    });
  }
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
