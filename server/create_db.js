const mysql = require('mysql2/promise');
const config = require('./config/config.json')['development'];

async function createDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: config.username,
            password: config.password
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
        console.log(`Database '${config.database}' created or already exists.`);
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    }
}

createDatabase();
