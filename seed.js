
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const User = require('./models/User');

dotenv.config();

const events = [
    {
        name: "Tech Conference 2026",
        description: "The biggest tech conference of the year featuring AI and Web3.",
        location: "Convention Center, New York",
        date: new Date('2026-06-15'),
        startTime: "09:00",
        endTime: "17:00",
        capacity: 500,
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        status: "upcoming"
    },
    {
        name: "Flutter Workshop",
        description: "Hands-on workshop to master Flutter 4.0 and Dart.",
        location: "Tech Hub, San Francisco",
        date: new Date('2026-07-20'),
        startTime: "10:00",
        endTime: "14:00",
        capacity: 50,
        imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=1000",
        status: "upcoming"
    },
    {
        name: "Startup Networking Night",
        description: "Meet founders, investors, and fellow developers.",
        location: "Innovation Lab, London",
        date: new Date('2026-08-05'),
        startTime: "18:00",
        endTime: "21:00",
        capacity: 100,
        imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000",
        status: "upcoming"
    }
];

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ MongoDB Connected');

        try {
            // Get the first user as organizer (likely the one you just created)
            const admin = await User.findOne();
            if (!admin) {
                console.log('❌ No users found. Please register a user first.');
                process.exit(1);
            }

            console.log(`👤 Using Organizer: ${admin.name} (${admin.email})`);

            // Delete existing events to avoid duplicates
            await Event.deleteMany({});
            console.log('🗑️  Cleared existing events');

            // Add organizer to events
            const eventData = events.map(e => ({ ...e, organizer: admin._id }));

            // Insert events
            await Event.insertMany(eventData);
            console.log('✅ Seeded 3 Events successfully!');

        } catch (error) {
            console.error('❌ Error seeding data:', error);
        } finally {
            mongoose.connection.close();
            process.exit();
        }
    })
    .catch(err => {
        console.error('❌ Connection Error:', err);
    });
