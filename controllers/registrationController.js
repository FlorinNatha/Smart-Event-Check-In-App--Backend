const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Register for an event
// @route   POST /api/registrations/:eventId
// @access  Private
exports.registerForEvent = async (req, res) => {
    try {
        const eventId = req.params.eventId || req.params.id;
        const userId = req.user._id;

        // 1. Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 2. Check if already registered
        const existingRegistration = await Registration.findOne({
            event: eventId,
            user: userId
        });

        if (existingRegistration) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        // 3. Check capacity
        const registrationCount = await Registration.countDocuments({ event: eventId });
        if (registrationCount >= event.capacity) {
            return res.status(400).json({ message: 'Event is full' });
        }

        // 4. Create registration
        const registration = await Registration.create({
            event: eventId,
            user: userId,
            status: 'registered',
            registeredAt: Date.now()
        });

        res.status(201).json(registration);

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get my registrations (tickets)
// @route   GET /api/registrations/my-tickets
// @access  Private
exports.getMyRegistrations = async (req, res) => {
    try {
        console.log('🎟️ Fetching tickets for user:', req.user._id);
        const registrations = await Registration.find({ user: req.user._id })
            .populate('event', 'name date location startTime imageUrl status')
            .sort({ registeredAt: -1 });

        console.log(`✅ Found ${registrations.length} tickets`);
        res.json(registrations);
    } catch (error) {
        console.error('❌ Error fetching tickets:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get registration by ID (for Ticket Screen)
// @route   GET /api/registrations/:id
// @access  Private
exports.getTicketById = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id)
            .populate('event')
            .populate('user', 'name email');

        console.log(`🎫 getTicketById:`, JSON.stringify(registration, null, 2));

        if (!registration) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        // Ensure user owns the ticket or is admin
        if (registration.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Not authorized to view this ticket' });
        }

        res.json(registration);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private
exports.cancelRegistration = async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id);

        if (!registration) {
            return res.status(404).json({ message: 'Registration not found' });
        }

        // Ensure user owns the ticket
        if (registration.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await registration.deleteOne();
        res.json({ message: 'Registration cancelled' });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Validate ticket (Staff only)
// @route   POST /api/registrations/validate
// @access  Private (Staff/Admin)
exports.validateTicket = async (req, res) => {
    try {
        const { ticketId, eventId } = req.body;

        // Find registration
        // We can search by ticketId (Registration _id) directly
        const registration = await Registration.findById(ticketId).populate('user', 'name email');

        if (!registration) {
            return res.status(404).json({ message: 'Invalid Ticket' });
        }

        // Verify it belongs to the correct event
        if (registration.event.toString() !== eventId) {
            console.log(`❌ Validation Failed: Event Mismatch`);
            console.log(`Expected (Ticket Event): '${registration.event.toString()}'`);
            console.log(`Received (Request Event): '${eventId}'`);
            console.log('Request Body:', JSON.stringify(req.body)); // Typo risk, just JSON.stringify
            return res.status(400).json({ message: 'Ticket does not belong to this event' });
        }

        // Check if already checked in
        if (registration.status === 'checked-in') {
            return res.status(400).json({
                message: 'Ticket already used',
                checkedInAt: registration.checkedInAt,
                user: registration.user
            });
        }

        // Check if cancelled
        if (registration.status === 'cancelled') {
            return res.status(400).json({ message: 'Ticket belongs to a cancelled registration' });
        }

        // Update status
        registration.status = 'checked-in';
        registration.checkedInAt = Date.now();
        registration.checkedInBy = req.user._id;

        await registration.save();

        res.json({
            message: 'Check-in Successful',
            user: registration.user,
            checkedInAt: registration.checkedInAt
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get staff scan history
// @route   GET /api/registrations/staff/history
// @access  Private (Staff/Admin)
exports.getStaffScanHistory = async (req, res) => {
    try {
        const history = await Registration.find({ checkedInBy: req.user._id })
            .populate('event', 'name')
            .populate('user', 'name email')
            .sort({ checkedInAt: -1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
