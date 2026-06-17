const Message = require('../models/Message');
const Complaint = require('../models/Complaint');
const ChatRead = require('../models/ChatRead');
const fs = require('fs');

// @desc    Get chat history for a specific complaint
// @route   GET /api/v1/chat/history/:complaintId
// @access  Private (Admin, Creator Citizen, Assigned Agent)
const getChatHistory = async (req, res) => {
  try {
    const { complaintId } = req.params;

    // Validate complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Access authorization check
    let isAuthorized = false;

    if (req.user.role === 'Admin') {
      isAuthorized = true;
    } else if (req.user.role === 'Ordinary') {
      if (complaint.userId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    } else if (req.user.role === 'Agent') {
      if (complaint.assignedAgentId && complaint.assignedAgentId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to view this chat history.',
      });
    }

    // Update lastReadAt for current user
    await ChatRead.findOneAndUpdate(
      { userId: req.user._id, complaintId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    );

    // Fetch messages sorted oldest first (createdAt ascending)
    const messages = await Message.find({ complaintId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email role');

    return res.status(200).json({
      success: true,
      data: { messages },
      message: 'Chat history loaded successfully.',
    });
  } catch (error) {
    console.error(`GetChatHistory Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving chat history.',
    });
  }
};

// @desc    Send a new chat message
// @route   POST /api/v1/chat/messages
// @access  Private (Creator Citizen or Assigned Agent)
const sendChatMessage = async (req, res) => {
  try {
    const { complaintId, message } = req.body;

    // Validate required body fields
    if (!complaintId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both complaintId and message.',
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.',
      });
    }

    if (trimmedMessage.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 1000 characters.',
      });
    }

    // Validate complaint exists
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Verify complaint status is In Progress
    if (complaint.status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Chat is only active for complaints in "In Progress" status.',
      });
    }

    // Verify role permissions
    // Admins cannot send messages
    if (req.user.role === 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrators cannot send chat messages.',
      });
    }

    let isAuthorized = false;

    if (req.user.role === 'Ordinary') {
      if (complaint.userId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    } else if (req.user.role === 'Agent') {
      if (complaint.assignedAgentId && complaint.assignedAgentId.toString() === req.user._id.toString()) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to send messages to this complaint chat.',
      });
    }

    // Save message
    const chatMsg = await Message.create({
      complaintId,
      senderId: req.user._id,
      name: req.user.name,
      message: trimmedMessage,
    });

    return res.status(201).json({
      success: true,
      data: { message: chatMsg },
      message: 'Message sent successfully.',
    });
  } catch (error) {
    console.error(`SendChatMessage Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error sending chat message.',
    });
  }
};

const uploadAttachment = async (req, res) => {
  try {
    const { complaintId, message } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Attachment file is required.',
      });
    }

    if (!complaintId) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'complaintId is required.',
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    // Validate status In Progress or Work Started
    if (complaint.status !== 'In Progress' && complaint.status !== 'Work Started') {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Chat is only active for complaints in "In Progress" or "Work Started" status.',
      });
    }

    // Validate ownership or assigned agent
    const isOwner = complaint.userId.toString() === req.user._id.toString();
    const isAgent = complaint.assignedAgentId && complaint.assignedAgentId.toString() === req.user._id.toString();

    if (!isOwner && !isAgent) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not authorized to send attachments to this complaint chat.',
      });
    }

    const attachmentUrl = `/uploads/chat/${req.file.filename}`;
    const attachmentName = req.file.originalname;
    const attachmentType = req.file.mimetype;

    const chatMsg = await Message.create({
      complaintId,
      senderId: req.user._id,
      name: req.user.name,
      message: message ? message.trim() : '',
      attachmentUrl,
      attachmentName,
      attachmentType,
    });

    // Broadcast message via Socket.IO
    try {
      const { getIO } = require('../services/socketService');
      const io = getIO();
      const room = `room:${complaintId}`;
      io.to(room).emit('receiveMessage', chatMsg);
    } catch (socketErr) {
      console.error('Socket broadcast failed for attachment:', socketErr.message);
    }

    return res.status(201).json({
      success: true,
      data: { message: chatMsg },
      message: 'Attachment uploaded successfully.',
    });
  } catch (error) {
    console.error(`UploadAttachment Error: ${error.message}`);
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('File cleanup failed:', err.message);
      }
    }
    return res.status(500).json({
      success: false,
      message: 'Server error uploading chat attachment.',
    });
  }
};

const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    let query = {};
    if (req.user.role === 'Ordinary') {
      query = { userId };
    } else if (req.user.role === 'Agent') {
      query = { assignedAgentId: userId };
    } else {
      return res.status(200).json({ success: true, data: [] });
    }

    const complaints = await Complaint.find(query).select('_id');
    const complaintIds = complaints.map((c) => c._id);

    const readRecords = await ChatRead.find({ userId, complaintId: { $in: complaintIds } });
    const readMap = {};
    readRecords.forEach((r) => {
      readMap[r.complaintId.toString()] = r.lastReadAt;
    });

    const unreadCounts = await Promise.all(
      complaintIds.map(async (id) => {
        const lastReadAt = readMap[id.toString()] || new Date(0);
        const count = await Message.countDocuments({
          complaintId: id,
          senderId: { $ne: userId },
          createdAt: { $gt: lastReadAt },
        });
        return {
          complaintId: id,
          unreadCount: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: unreadCounts,
    });
  } catch (error) {
    console.error(`GetUnreadCounts Error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving unread counts.',
    });
  }
};

module.exports = {
  getChatHistory,
  sendChatMessage,
  uploadAttachment,
  getUnreadCounts,
};
