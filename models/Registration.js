const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ['registered', 'checked-in', 'cancelled'],
        default: 'registered',
    },
    checkedInAt: {
        type: Date,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    },
    checkedInBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

// Prevent duplicate registration
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
