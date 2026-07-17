const db = require('./models');
const bcrypt = require('bcrypt');

async function test() {
    const user = await db.User.findOne({ where: { email: 'admin@biogas.com' } });
    if (!user) {
        console.log('User admin@biogas.com not found');
    } else {
        console.log('User found:', user.email);
        const match = await bcrypt.compare('Admin@123', user.password);
        console.log('Password "Admin@123" matches:', match);
    }
    process.exit(0);
}

test();
