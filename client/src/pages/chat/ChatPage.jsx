import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import chatService from '../../services/chatService';
import complaintService from '../../services/complaintService';
import { initiateSocket, disconnectSocket, getSocket } from '../../services/socket';
import Navbar from '../../components/common/Navbar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import { toast } from 'react-toastify';

const ChatPage = () => {
  const { complaintId } = useParams();
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  // Attachment states
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch ticket details
  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const res = await complaintService.getComplaintById(complaintId);
        setTicket(res.data?.complaint || res.data);
      } catch (err) {
        console.error('Failed to load complaint details:', err.message);
      }
    };
    if (complaintId) fetchTicket();
  }, [complaintId]);

  // Fetch initial chat history via REST API
  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      try {
        const res = await chatService.getChatHistory(complaintId);
        setMessages(res.data?.messages || res.data || []);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load chat history.');
      } finally {
        setLoading(false);
      }
    };

    if (complaintId) {
      fetchChatHistory();
    }
  }, [complaintId]);

  // Connect socket and handle events
  useEffect(() => {
    if (!complaintId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Not authorized. Token missing.');
      return;
    }

    const socket = initiateSocket(token);
    socket.connect();

    if (socket.connected) {
      setSocketConnected(true);
      socket.emit('joinRoom', { complaintId });
    }

    socket.on('connect', () => {
      setSocketConnected(true);
      socket.emit('joinRoom', { complaintId });
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('receiveMessage', (message) => {
      setMessages((prev) => {
        // Prevent duplicate rendering
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setSocketConnected(false);
    });

    return () => {
      if (socket) {
        socket.emit('leaveRoom', { complaintId });
        socket.off('connect');
        socket.off('disconnect');
        socket.off('receiveMessage');
        socket.off('connect_error');
      }
    };
  }, [complaintId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // File Picker change handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    // Validate type limit (.jpg, .jpeg, .png, .gif, .webp, .pdf, .doc, .docx)
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      toast.error('Only images (JPG, PNG, GIF, WEBP), PDF, and DOC files are allowed.');
      return;
    }

    setSelectedFile(file);
  };

  // Send message via Socket.io or REST for Attachments
  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !selectedFile) return;

    if (selectedFile) {
      // Send attachment + optional message via REST API
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('complaintId', complaintId);
        if (messageText.trim()) {
          formData.append('message', messageText.trim());
        }
        formData.append('attachment', selectedFile);

        await chatService.uploadAttachment(formData);
        setSelectedFile(null);
        setMessageText('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to upload attachment.');
      } finally {
        setUploading(false);
      }
    } else {
      // Send text message via Socket.io
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('clientMessage', { complaintId, message: messageText.trim() });
        setMessageText('');
      } else {
        toast.error('Chat is disconnected. Attempting to reconnect...');
        socket?.connect();
      }
    }
  };

  const getBackLink = () => {
    if (user?.role === 'Agent') return '/agent/dashboard';
    return '/user/dashboard';
  };

  const isChatDisabled = () => {
    if (!ticket) return false;
    return ticket.status !== 'In Progress' && ticket.status !== 'Work Started';
  };

  const isImageAttachment = (msg) => {
    if (msg.attachmentType && msg.attachmentType.startsWith('image/')) return true;
    if (msg.attachmentUrl) {
      const ext = msg.attachmentUrl.split('.').pop().toLowerCase();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    }
    return false;
  };

  const getAttachmentUrl = (relativeUrl) => {
    if (!relativeUrl) return '';
    if (relativeUrl.startsWith('http')) return relativeUrl;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const baseHost = apiUrl.replace(/\/api\/v1\/?$/, ''); // Strips /api/v1
    return `${baseHost}${relativeUrl}`;
  };

  if (loading && messages.length === 0) {
    return (
      <>
        <Navbar />
        <div className="py-5"><LoadingSpinner /></div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-4 animate-fade-in" style={{ height: 'calc(100vh - 80px)' }}>
        <div className="d-flex flex-column h-100 glass-panel">
          {/* Header Panel */}
          <div className="p-3 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center bg-dark bg-opacity-20 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <Link to={getBackLink()} className="btn btn-outline-secondary btn-sm text-secondary">
                &larr; Back
              </Link>
              <div>
                <h5 className="text-white fw-bold m-0 text-truncate" style={{ maxWidth: '300px' }}>
                  {ticket ? ticket.name : 'Complaint Chat'}
                </h5>
                <span className="text-muted small">
                  ID: #{complaintId.substring(complaintId.length - 6).toUpperCase()}
                  <span className={`ms-2 ms-md-3 badge ${socketConnected ? 'bg-success' : 'bg-danger'} rounded-circle p-1`} style={{ width: '8px', height: '8px', display: 'inline-block' }} title={socketConnected ? 'Real-time Connected' : 'Disconnected'}></span>
                </span>
              </div>
            </div>
            {ticket && (
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-light bg-opacity-10 text-info small">{ticket.category}</span>
                <StatusBadge status={ticket.status} />
              </div>
            )}
          </div>

          {/* Messages Feed Area */}
          <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column gap-3" style={{ background: 'rgba(10, 11, 16, 0.4)' }}>
            {messages.length > 0 ? (
              messages.map((msg) => {
                const senderId =
                  typeof msg.senderId === 'object'
                    ? msg.senderId._id
                    : msg.senderId;

                const isMe = senderId === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`d-flex flex-column ${isMe ? 'align-items-end text-end ms-auto' : 'align-items-start text-start me-auto'}`}
                    style={{ maxWidth: '75%' }}
                  >
                    <span className="text-secondary small fw-semibold mb-1 px-1">{isMe ? 'You' : msg.name}</span>
                    <div
                      className={`p-3 rounded ${isMe ? 'bg-primary bg-opacity-75 text-white' : 'bg-light bg-opacity-10 text-white'
                        }`}
                      style={{ borderRadius: '12px', wordBreak: 'break-word' }}
                    >
                      {/* Attachment Rendering */}
                      {msg.attachmentUrl && (
                        <div className="mb-2">
                          {isImageAttachment(msg) ? (
                            <a href={getAttachmentUrl(msg.attachmentUrl)} target="_blank" rel="noopener noreferrer">
                              <img
                                src={getAttachmentUrl(msg.attachmentUrl)}
                                alt={msg.attachmentName || 'Attachment'}
                                className="img-fluid rounded mb-1"
                                style={{ maxHeight: '200px', cursor: 'zoom-in', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                              />
                            </a>
                          ) : (
                            <div className="d-flex align-items-center gap-2 p-2 bg-dark bg-opacity-30 rounded border border-light border-opacity-10">
                              <span className="fs-5">📄</span>
                              <div className="text-start" style={{ maxWidth: '180px' }}>
                                <span className="d-block small text-white text-truncate fw-medium">
                                  {msg.attachmentName || 'Document'}
                                </span>
                              </div>
                              <a
                                href={getAttachmentUrl(msg.attachmentUrl)}
                                download={msg.attachmentName || 'file'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-gradient py-1 px-2.5 ms-2 text-decoration-none"
                                style={{ fontSize: '0.75rem' }}
                              >
                                Get
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {msg.message && <p className="m-0 small">{msg.message}</p>}
                    </div>
                    <span className="text-muted small mt-1 px-1" style={{ fontSize: '0.7rem' }}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="my-auto text-center py-5">
                <span className="fs-1 d-block mb-3">💬</span>
                <h5 className="text-white">Start the conversation</h5>
                <p className="text-secondary small">Send a message to share repair details or resolve questions.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Form Input Bar */}
          <div className="p-3 border-top border-light border-opacity-10 bg-dark bg-opacity-20">
            {isChatDisabled() ? (
              <div className="alert alert-secondary border-0 bg-secondary bg-opacity-10 text-secondary text-center small mb-0 py-2.5">
                🔒 Chat is disabled because this ticket is not in an active status (In Progress or Work Started).
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {/* File input selection info */}
                {selectedFile && (
                  <div className="d-flex align-items-center justify-content-between p-2 bg-light bg-opacity-5 rounded border border-light border-opacity-10">
                    <span className="small text-info text-truncate" style={{ maxWidth: '85%' }}>
                      📎 {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-0 px-2 border-0"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={uploading}
                    >
                      ✕
                    </button>
                  </div>
                )}

                 {/* Warning if socket is disconnected */}
                {!socketConnected && (
                  <div className="text-warning small mb-1 px-1">
                    ⚠️ Realtime connection is reconnecting...
                  </div>
                )}

                <form onSubmit={handleSend} className="d-flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx"
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    title="Attach File"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    className="form-control glass-input"
                    placeholder="Type your message here..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={uploading}
                  />
                  <button
                    type="submit"
                    disabled={uploading || (!messageText.trim() && !selectedFile)}
                    className="btn btn-gradient px-4 py-2 fw-semibold d-flex align-items-center"
                  >
                    {uploading ? 'Sending...' : 'Send'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatPage;
