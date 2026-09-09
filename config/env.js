const dotenv = require('dotenv');

dotenv.config();

const requiredEnvVars = ['JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`[CRITICAL] Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const env = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_reservation',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  taxRate: parseFloat(process.env.TAX_RATE) >= 0 ? parseFloat(process.env.TAX_RATE) : 5,
  serviceChargeRate: parseFloat(process.env.SERVICE_CHARGE_RATE) >= 0 ? parseFloat(process.env.SERVICE_CHARGE_RATE) : 5
};

module.exports = env;
