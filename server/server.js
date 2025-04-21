import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import profileRoutes from './routes/profile.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import receiptRoutes from './routes/receipts.js';
import billDesignRoutes from './routes/billDesign.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import authRouter from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import templateRoutes from './routes/templates.js';
import staffRoutes from './routes/staff.js';
import expenseRoutes from './routes/expenses.js';
import invoiceRoutes from './routes/invoices.js';
import activityLogRoutes from './routes/activityLogs.js';
import reminderRoutes from './routes/reminders.js';
import importRoutes from './routes/import.js';
import backupRoutes from './routes/backup.js';
import stripeWebhookRoutes from './routes/stripeWebhook.js';
import passport from './config/googleAuth.js';
import session from 'express-session';
import path from 'path';
import fs from 'fs';

const app = express();
app.use(cors());
app.use(express.json());

// --- FAVICON ROUTE ---
app.get('/favicon.ico', (req, res) => {
  // You can also serve a real favicon if you have one in /public or /static
  res.status(204).end();
});

// MongoDB connection
const MONGO_URI = 'mongodb+srv://adiinamdar18:ACRE9osXpejdQlAl@greenreceipt.s3jcse2.mongodb.net/greenreceipt?retryWrites=true&w=majority&appName=greenreceipt';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  // Add a helpful message for Atlas users
  console.error('If you are using MongoDB Atlas, make sure your current IP is whitelisted: https://www.mongodb.com/docs/atlas/security-whitelist/');
});

mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected successfully.');
});

app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/profile', profileRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/bill-design', billDesignRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/import', importRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/stripe', stripeWebhookRoutes);
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send('GreenReceipt API Running');
});

// Allow port override from command line: node server.js --port=3000
let PORT = 5000;
const portArg = process.argv.find(arg => arg.startsWith('--port='));
if (portArg) {
  PORT = parseInt(portArg.split('=')[1], 10);
} else if (process.env.PORT) {
  PORT = parseInt(process.env.PORT, 10);
}
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
