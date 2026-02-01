
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'name email');

        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin only)
exports.createEvent = async (req, res) => {
    try {
        console.log('📝 Create Event Request Body:', req.body);
        console.log('👤 User:', req.user);

        // Destructure all possible fields
        let { name, description, location, date, capacity, imageUrl, startTime, endTime, startDate, endDate } = req.body;

        // ADAPTATION: If date/startTime/endTime are missing but startDate/endDate exist (Old Frontend Payload)
        if (!date && startDate) {
            date = startDate; // Use startDate as the main date

            // Extract HH:mm from startDate if startTime is missing
            if (!startTime) {
                const startObj = new Date(startDate);
                startTime = `${startObj.getHours().toString().padStart(2, '0')}:${startObj.getMinutes().toString().padStart(2, '0')}`;
            }

            // Extract HH:mm from endDate if endTime is missing
            if (!endTime && endDate) {
                const endObj = new Date(endDate);
                endTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;
            }
        }

        const event = await Event.create({
            name,
            description,
            location,
            date,
            capacity,
            imageUrl,
            startTime: startTime || '09:00', // Default if still missing
            endTime: endTime || '17:00',     // Default if still missing
            organizer: req.user._id,
            status: 'upcoming'
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin only)
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });
            res.json(updatedEvent);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin only)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (event) {
            await event.deleteOne();
            res.json({ message: 'Event removed' });
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/events/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        const totalEvents = await Event.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const totalCheckIns = await Registration.countDocuments({ status: 'checked-in' });

        const attendanceRate = totalRegistrations > 0
            ? ((totalCheckIns / totalRegistrations) * 100).toFixed(1)
            : 0;

        res.json({
            totalEvents,
            totalRegistrations,
            totalCheckIns,
            attendanceRate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get event stats
// @route   GET /api/events/:id/stats
// @access  Private (Admin only)
exports.getEventStats = async (req, res) => {
    try {
        const eventId = req.params.id;
        const totalRegistrations = await Registration.countDocuments({ event: eventId });
        const totalCheckIns = await Registration.countDocuments({ event: eventId, status: 'checked-in' });

        const attendanceRate = totalRegistrations > 0
            ? ((totalCheckIns / totalRegistrations) * 100).toFixed(1)
            : 0;

        res.json({
            totalRegistrations,
            totalCheckIns,
            attendanceRate
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Private (Admin only)
exports.getEventRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find({ event: req.params.id })
            .populate('user', 'name email')
            .sort({ registeredAt: -1 });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
