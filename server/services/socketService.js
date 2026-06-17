const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Message = require('../models/Message');

let io;

const initSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
      }

      if (!token) {
        return next(new Error('Authentication error. Token is required.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error. User not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication failed:', err.message);
      return next(new Error('Authentication error. Invalid token.'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected via socket: ${socket.user.name} (${socket.user.role})`);
    
    // Join private user room for personal notifications
    socket.join(`user:${socket.user._id}`);

    // Join room for complaint chat
    socket.on('joinRoom', ({ complaintId }) => {
      if (!complaintId) return;
      const room = `room:${complaintId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Send chat message in room
    socket.on('clientMessage', async ({ complaintId, message }) => {
      try {
        if (!complaintId || !message || !message.trim()) {
          return;
        }

        const complaint = await Complaint.findById(complaintId);
        if (!complaint) {
          console.warn(`Socket message rejected: Complaint ${complaintId} not found.`);
          return;
        }

        // Validate complaint status is active (In Progress / Work Started)
        if (complaint.status !== 'In Progress' && complaint.status !== 'Work Started') {
          console.warn(`Socket message rejected: Chat not active for complaint ${complaintId}.`);
          return;
        }

        // Check if user is creator or assigned technician or admin
        const isOwner = complaint.userId.toString() === socket.user._id.toString();
        const isAgent = complaint.assignedAgentId && complaint.assignedAgentId.toString() === socket.user._id.toString();
        const isAdmin = socket.user.role === 'Admin';

        if (!isOwner && !isAgent && !isAdmin) {
          console.warn(`Socket message rejected: User not authorized.`);
          return;
        }

        // Save to Database
        const newMessage = await Message.create({
          complaintId,
          senderId: socket.user._id,
          name: socket.user.name,
          message: message.trim()
        });

        // Broadcast to room members
        const room = `room:${complaintId}`;
        io.to(room).emit('receiveMessage', newMessage);
        console.log(`Message broadcasted in room: ${room}`);
      } catch (err) {
        console.error('Error handling clientMessage socket event:', err.message);
      }
    });

    // Leave room
    socket.on('leaveRoom', ({ complaintId }) => {
      if (!complaintId) return;
      const room = `room:${complaintId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected from socket: ${socket.user.name}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized.');
  }
  return io;
};

module.exports = {
  initSocket,
  getIO,
};
