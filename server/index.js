const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

const connectToDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const agentRoutes = require('./routes/agentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const chatRoutes = require('./routes/chatRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');






const path = require('path');

// Load environment variables
dotenv.config();

const app = express();

// Connect to Database
connectToDB();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/admin/dashboard', dashboardRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);






// Root Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Complaint Registration API is running.',
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(`Unhandled Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const http = require('http');
const { initSocket } = require('./services/socketService');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
  );
});