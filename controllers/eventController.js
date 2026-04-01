
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Compute real-time status for an event based on current date/time.
 * 'cancelled' is always preserved (manual override).
 */
function computeStatus(event) {
    if (event.status === 'cancelled') return 'cancelled';

    const now = new Date();
    const eventDate = new Date(event.date);

    // Build a start datetime: event date + startTime ("HH:mm")
    const startDateTime = new Date(eventDate);
    if (event.startTime) {
        const [sh, sm] = event.startTime.split(':').map(Number);
        startDateTime.setHours(sh, sm, 0, 0);
    } else {
        startDateTime.setHours(0, 0, 0, 0);
    }

    // Build an end datetime: event date + endTime ("HH:mm")
    const endDateTime = new Date(eventDate);
    if (event.endTime) {
        const [eh, em] = event.endTime.split(':').map(Number);
        endDateTime.setHours(eh, em, 59, 999);
    } else {
        endDateTime.setHours(23, 59, 59, 999);
    }

    if (now < startDateTime) return 'upcoming';
    if (now >= startDateTime && now <= endDateTime) return 'ongoing';
    return 'completed';
}

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });

        // Compute live registeredCount and live status for each event
        const eventsWithCounts = await Promise.all(
            events.map(async (event) => {
                const count = await Registration.countDocuments({
                    event: event._id,
                    status: { $in: ['registered', 'checked-in'] }
                });
                const obj = event.toObject();
                obj.registeredCount = count;
                obj.status = computeStatus(obj);
                return obj;
            })
        );

        res.json(eventsWithCounts);
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
            // Always compute live registeredCount and status
            const liveCount = await Registration.countDocuments({
                event: event._id,
                status: { $in: ['registered', 'checked-in'] }
            });
            const eventObj = event.toObject();
            eventObj.registeredCount = liveCount;
            eventObj.status = computeStatus(eventObj);
            res.json(eventObj);
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
            console.log('🔄 Update Event Request Body:', req.body);

            let updateData = { ...req.body };

            // ADAPTATION: Handle Legacy/Alternative Date Formats 
            // If date/startTime/endTime are missing but startDate/endDate exist
            if (!updateData.date && updateData.startDate) {
                console.log('⚠️ Adapting Legacy Format in Update');
                updateData.date = updateData.startDate;

                if (!updateData.startTime) {
                    const startObj = new Date(updateData.startDate);
                    updateData.startTime = `${startObj.getHours().toString().padStart(2, '0')}:${startObj.getMinutes().toString().padStart(2, '0')}`;
                }

                if (!updateData.endTime && updateData.endDate) {
                    const endObj = new Date(updateData.endDate);
                    updateData.endTime = `${endObj.getHours().toString().padStart(2, '0')}:${endObj.getMinutes().toString().padStart(2, '0')}`;
                }
            }

            // Ensure values are not null/undefined if we want to update them
            // If they are passed as null strings from some forms
            if (updateData.startTime === 'null') delete updateData.startTime;
            if (updateData.endTime === 'null') delete updateData.endTime;

            // --- INVALIDATION LOGIC ---
            // If the event is being updated, we must invalidate all existing registrations
            // as per user requirement: "they need to register updated event for again"
            
            const existingRegistrations = await Registration.find({ event: req.params.id });
            
            if (existingRegistrations.length > 0) {
                console.log(`⚠️ Invalidating ${existingRegistrations.length} registrations for event ${event.name}`);
                
                // 1. Create notifications for each user
                const notifications = existingRegistrations.map(reg => ({
                    user: reg.user,
                    event: event._id,
                    message: `Important: The event "${event.name}" has been updated. Your previous registration has been cleared. Please review the new details and register again if you still wish to attend.`,
                    type: 'event_update'
                }));
                
                await Notification.insertMany(notifications);
                
                // 2. Delete all registrations
                await Registration.deleteMany({ event: req.params.id });
                
                // 3. Reset registeredCount in update payload
                updateData.registeredCount = 0;
            }

            const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updateData, {
                new: true,
                runValidators: true
            });

            console.log('✅ Event Updated & Registrations Invalidated:', updatedEvent.name);
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

// @desc    Get ALL global registrations (useful for home dashboard grouping)
// @route   GET /api/events/admin/all-registrations
// @access  Private (Admin only)
exports.getAllRegistrations = async (req, res) => {
    try {
        const registrations = await Registration.find()
            .populate('user', 'name email')
            .populate('event', 'name date location')
            .sort({ registeredAt: -1 });

        res.json(registrations);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
