/**
 * Message Controller
 * Handles the realtime API and views for the dashboard messaging system
 */

const Message = require('../models/Message');
const User = require('../models/User');

// View the main messages UI
exports.getMessagesPage = async (req, res) => {
    try {
        res.render('messages/index', {
            title: 'Messages — Food Flux',
            user: req.session.user
        });
    } catch (err) {
        console.error('Messages page error:', err);
        req.session.error = 'Failed to load messages';
        res.redirect('/');
    }
};

// API: Get all chat threads (unique users conversed with)
exports.getThreads = async (req, res) => {
    try {
        const userId = req.session.user.id;

        // Find all messages involving this user
        const messages = await Message.find({
            $or: [{ sender: userId }, { receiver: userId }]
        }).sort({ createdAt: -1 }).populate('sender receiver', 'name restaurantName profileImageUrl role');

        // Group into threads
        const threadsMap = new Map();

        messages.forEach(msg => {
            const otherUser = msg.sender._id.toString() === userId ? msg.receiver : msg.sender;
            const otherUserId = otherUser._id.toString();

            if (!threadsMap.has(otherUserId)) {
                threadsMap.set(otherUserId, {
                    user: otherUser,
                    lastMessage: msg,
                    unreadCount: 0
                });
            }

            if (msg.receiver._id.toString() === userId && !msg.read) {
                threadsMap.get(otherUserId).unreadCount++;
            }
        });

        const threads = Array.from(threadsMap.values());
        res.json({ threads });
    } catch (err) {
        console.error('Get threads API error:', err);
        res.status(500).json({ error: 'Failed to fetch threads' });
    }
};

// API: Get messages for a specific thread
exports.getMessages = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const otherId = req.params.userId;

        const messages = await Message.find({
            $or: [
                { sender: userId, receiver: otherId },
                { sender: otherId, receiver: userId }
            ]
        }).sort({ createdAt: 1 }).populate('sender receiver', 'name');

        // Mark messages from other user as read
        await Message.updateMany(
            { sender: otherId, receiver: userId, read: false },
            { $set: { read: true } }
        );

        res.json({ messages });
    } catch (err) {
        console.error('Get messages API error:', err);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

// API: Send a new message
exports.sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        const newMsg = await Message.create({
            sender: req.session.user.id,
            receiver: receiverId,
            content: content.trim()
        });

        const populatedMsg = await Message.findById(newMsg._id).populate('sender receiver', 'name');

        // Emit real-time message via socket
        const io = req.app.get('io');
        // Both the sender and receiver should be notified in their respective unique rooms (user IDs)
        io.to(receiverId).emit('newMessage', populatedMsg);
        io.to(req.session.user.id).emit('newMessage', populatedMsg);

        res.status(201).json({ message: populatedMsg });
    } catch (err) {
        console.error('Send message API error:', err);
        res.status(500).json({ error: 'Failed to send message' });
    }
};
