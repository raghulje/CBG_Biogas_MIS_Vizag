require('dotenv').config();

const pool = {
  max: process.env.DB_POOL_MAX ? Number(process.env.DB_POOL_MAX) : 10,
  min: process.env.DB_POOL_MIN ? Number(process.env.DB_POOL_MIN) : 0,
  acquire: process.env.DB_POOL_ACQUIRE ? Number(process.env.DB_POOL_ACQUIRE) : 30000,
  idle: process.env.DB_POOL_IDLE ? Number(process.env.DB_POOL_IDLE) : 10000
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'raghul',
    password: process.env.DB_PASS || 'RefexAdmin@123',
    database: process.env.DB_NAME || 'biogas_mis',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    pool
  },
  test: {
    username: process.env.DB_USER || 'raghul',
    password: process.env.DB_PASS || 'RefexAdmin@123',
    database: process.env.DB_NAME || 'biogas_mis',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    pool
  },
  production: {
    username: process.env.DB_USER || 'raghul',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || 'RefexAdmin@123',
    database: process.env.DB_NAME || 'biogas_mis',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: false,
    pool
  }
};

