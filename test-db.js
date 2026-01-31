const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

function log(msg) {
    fs.appendFileSync('error_log.txt', msg + '\n');
    console.log(msg);
}

log('URI: ' + process.env.MONGODB_URI);

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        log('✅ Connected');

        try {
            log('Attempting to create user...');
            const user = await User.create({
                name: 'Test User',
                email: 'test' + Date.now() + '@example.com',
                password: 'password123',
                role: 'attendee'
            });
            log('✅ User created: ' + JSON.stringify(user));
        } catch (err) {
            log('❌ Error creating user: ' + err.message + '\nStack: ' + err.stack);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => {
        log('❌ Connection Error: ' + err.message);
    });
