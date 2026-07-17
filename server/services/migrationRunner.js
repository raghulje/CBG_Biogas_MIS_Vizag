const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const db = require('../models');

const umzug = new Umzug({
  migrations: {
    glob: path.join(__dirname, '..', 'migrations', '*.js'),
    // Provide the classic sequelize-cli params (queryInterface, Sequelize) to migration functions
    params: [db.sequelize.getQueryInterface(), db.Sequelize]
  },
  context: db.sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db.sequelize }),
  logger: console
});

module.exports = {
  async runPendingMigrations() {
    // Ensure DB is connected
    await db.sequelize.authenticate();
    const pending = await umzug.pending();
    if (pending.length === 0) {
      console.log('No pending migrations');
      return;
    }
    console.log(`Applying ${pending.length} pending migrations...`);
    // Only run migrations when explicitly enabled via environment variable.
    // This protects production from accidental schema changes during deploy.
    if (process.env.RUN_MIGRATIONS === 'true') {
      console.log('RUN_MIGRATIONS=true — running pending migrations now.');
      await umzug.up();
      console.log('Migrations applied');
    } else {
      console.log('RUN_MIGRATIONS is not set to "true" — skipping pending migrations.');
    }
  },
  async list() {
    return await umzug.pending();
  },
  async revertLast() {
    await umzug.down();
  }
};

// If run directly, execute pending migrations
if (require.main === module) {
  (async () => {
    try {
      await module.exports.runPendingMigrations();
      process.exit(0);
    } catch (e) {
      console.error('Migration runner failed:', e);
      process.exit(1);
    }
  })();
}
