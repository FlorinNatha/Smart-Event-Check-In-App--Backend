const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Registration = require('./models/Registration');
const User = require('./models/User');
const Event = require('./models/Event');

dotenv.config();

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const users = await User.find();
        console.log(`found ${users.length} users`);

        const events = await Event.find();
        console.log(`found ${events.length} events`);

        const registrations = await Registration.find().populate('user').populate('event');
        console.log(`found ${registrations.length} registrations`);

        if (registrations.length > 0) {
            console.log('Sample Registration:', JSON.stringify(registrations[0], null, 2));
        } else {
            console.log('⚠️ No registrations found! This explains why tickets are empty.');
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debug();
