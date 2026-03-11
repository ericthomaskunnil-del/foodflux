/**
 * Localised Food Surplus Distribution System
 * Main server entry point
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
console.log("GMAIL USER:", process.env.GMAIL_USER);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lfds';

// ─── View Engine Setup ───────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middleware ──────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Session Configuration ──────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: 'sessions',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true
  }
}));

// ─── Global Template Variables ──────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;
  // Clear flash messages after reading
  delete req.session.success;
  delete req.session.error;
  next();
});

// ─── Routes ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const donorRoutes = require('./routes/donor');
const volunteerRoutes = require('./routes/volunteer');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/message');

// Landing page
app.get('/', async (req, res) => {
  try {
    const Review = require('./models/Review');
    const recentReviews = await Review.find({ rating: { $gte: 4 } })
      .populate('reviewer', 'name role')
      .populate('reviewee', 'name restaurantName')
      .sort({ createdAt: -1 })
      .limit(6);

    res.render('landing', {
      title: 'Food Flux — Food Surplus Distribution',
      reviews: recentReviews
    });
  } catch (err) {
    console.error('Landing error:', err);
    res.render('landing', {
      title: 'Food Flux — Food Surplus Distribution',
      reviews: []
    });
  }
});

app.use('/auth', authRoutes);
app.use('/donor', donorRoutes);
app.use('/volunteer', volunteerRoutes);
app.use('/admin', adminRoutes);
app.use('/messages', messageRoutes);

// Public Impact Dashboard
app.get('/dashboard', async (req, res) => {
  try {
    const FoodListing = require('./models/FoodListing');
    const Transaction = require('./models/Transaction');
    const User = require('./models/User');

    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    const totalListings = await FoodListing.countDocuments();
    const completedPickups = await Transaction.countDocuments({ status: 'completed' });

    // For Gamification: Fetch top donors (most created listings) and top volunteers (most completed pickups)
    const topDonors = await FoodListing.aggregate([
      { $group: { _id: "$donor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'donorDetails' } },
      { $unwind: "$donorDetails" }
    ]);

    const topVolunteers = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: "$volunteer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'volunteerDetails' } },
      { $unwind: "$volunteerDetails" }
    ]);

    // Calculate Environmental Impact (CO2 prevented, Water saved)
    // Avg 2kg CO2 per kg food, 1000L water per kg. Avg listing 5kg.
    const mealsSaved = completedPickups * 2; // Roughly 2 meals per kg, or just a simple multiplier
    const co2Saved = completedPickups * 5 * 2; // Using 5kg avg per pickup
    const waterSaved = completedPickups * 5 * 1000;

    res.render('public-dashboard', {
      title: 'Global Impact Dashboard | Food Flux',
      stats: {
        totalDonors,
        totalVolunteers,
        totalListings,
        completedPickups,
        mealsSaved,
        co2Saved,
        waterSaved
      },
      topDonors,
      topVolunteers
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { title: 'Error', message: 'Failed to load dashboard' });
  }
});

// ─── 404 Handler ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// ─── Error Handler ──────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong. Please try again later.'
  });
});

// ─── Database Connection & Server Start ─────────────────────────────
const connectWithRetry = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Seed data on first run
    const seedDatabase = require('./seed');
    await seedDatabase();

    // Initialize scheduled cron jobs
    const { initCronJobs } = require('./utils/cronJob');
    initCronJobs();

    // Socket.io integration
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);

      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    // Make io available to routes
    app.set('io', io);

    server.listen(PORT, () => {
      console.log(`🚀 LFDS running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⏳ Retrying in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

connectWithRetry();
