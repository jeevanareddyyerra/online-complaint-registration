import api from './api';

const chatService = {
  getChatHistory: async (complaintId) => {
    const response = await api.get(`/chat/history/${complaintId}`);
    return response.data;
  },
  sendMessage: async (complaintId, message) => {
    const response = await api.post('/chat/messages', { complaintId, message });
    return response.data;
  },
  uploadAttachment: async (formData) => {
    const response = await api.post('/chat/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getUnreadCounts: async () => {
    const response = await api.get('/chat/unread-counts');
    return response.data;
  }
};

export default chatService;
