import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_BASE_URL || '/';
// const API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    // if (token && !config.url.includes("/auth/login") && !config.url.includes("/users/signup")) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
      if (token && !config.url.startsWith("/auth")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config.params || config.data);
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    if (error.config) {
      console.error(
        `API Error: ${error.config.method?.toUpperCase()} ${error.config.url}`,
        error.response?.data || error.message
      );
    } else {
      console.error("API Error (no config):", error.response?.data || error.message);
    }
     // GLOBAL 401 HANDLING (Token Expired / Invalid)
    if (error.response?.status === 401) {
      console.log("Access token expired or invalid. Logging out...");
      // Remove stored token
      localStorage.removeItem("access_token");
      // Prevent infinite redirect loop
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
    return Promise.reject(error);
  }
);

// Auth-related API calls
export const signUpUser = (payload) => {
  return api.post("/users/signup", payload);
};

export const loginUser = ({ email, password, otp }) => {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  if (otp) {
    formData.append("otp", otp);
  }

  return api.post("/auth/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};

export const forgotPassword = ({ countryCode, mobile }) => {
  return api.post("/auth/forgot-password", {
    mobile_number: `${countryCode}${mobile}`.trim()
  });
};

export const forgotUsername = ({ mobile }) => {
  return api.post("/auth/forgot-username", {
    phone_number: mobile.trim(),
  });
};

export const getInboxMails = () => api.get("/email/inbox");

export const sendMail = (mailData) => {
  return api.post("/email/send", mailData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getSentMails = () => api.get("/email/sent");

export const getDraftMails = () => api.get("/email/drafts");

export const saveDraft = (data) => {
  return api.post("/email/draft", data);
};

export const updateDraft = (id, data) => {
  return api.patch(`/email/draft/${id}`, data);
};

export const getDraftById = (id) => {
  return api.get(`/email/draft/${id}`);
};

export const publishDraft = (id) => {
  return api.post(`/email/${id}/publish`);
};

export const getStarredMails = () => api.get("/email/starred");

export const toggleStarMail = (id, value) =>
  api.patch(`/email/${id}`, { is_favorite: value });

export const getImportantMails = () => api.get("/email/important");

export const getSpamMails = () => api.get("/email/spam");

export const getArchivedMails = () => api.get("/email/archived");

export const archiveMail = (id) =>  api.patch(`/email/${id}`, { is_archived: true });

export const unarchiveMail = (id) =>  api.patch(`/email/${id}`, { is_archived: false });

export const toggleReadMail = (id,value=true) => api.patch(`/email/${id}`, {is_read: value});

export const getTrashMails = () => api.get("/email/trash");
export const deleteMail = (id) => api.delete(`/email/${id}`);

export const restoreMail = (id) => api.post(`/email/${id}/restore`);

// --- Calendar-related API calls ---
export const createEvent = (payload, create_meeting_link = false) => api.post(`/events?create_meeting_link=${create_meeting_link}`, payload);
export const getEvent = (eventId) => api.get(`/events/${eventId}`);
export const updateEvent = (eventId, payload) => api.patch(`/events/${eventId}`, payload);
export const deleteEvent = (eventId) => api.delete(`/events/${eventId}`);
export const listEventsForDay = (dateStr) => api.get('/events/day', { params: { date: dateStr } });
export const listEventsForWeek = (startDate) => api.get('/events/week', { params: { start_date: startDate } });
export const listEventsForMonth = (year, month) => api.get('/events/month', { params: { year, month } });
export const addAttendees = (eventId, userIds) => api.post(`/events/${eventId}/attendees`, userIds);
export const respondEvent = (eventId, status) => api.post(`/events/${eventId}/respond`, null, { params: { status } });
export const createMeeting = (payload) => api.post('/events/meeting', payload);
export const createSimpleReminder = (payload) => api.post('/calendar/events', payload);

// --- Chat-related API functions ---

/**
 * Create a new chat room with another user
 * @param {string} userId - ID of the user to chat with
 * @param {string} userEmail - Email of the user to chat with
 * @returns {Promise} - Created room data
 */
export const createChatRoom = async (userId, userEmail) => {
  try {
    console.log('Creating chat room with user:', { userId, userEmail });
    
    // The API expects participant_emails
    const payload = { participant_emails: [userEmail] };
    
    console.log('Sending payload:', payload);
    const response = await api.post('/chat/rooms', payload);
    console.log('✅ Created chat room:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error creating chat room:', error);
    throw error;
  }
};

/**
 * Search for chats by search term
 */
export const searchChats = async (searchTerm) => {
  try {
    const response = await api.get('/chat/search', {
      params: { q: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching chats:', error);
    throw error;
  }
};

/**
 * Get online status for a user
 * @param {string|number} userId - User ID or email
 * @returns {Promise} - Online status object
 */
export const getOnlineStatus = async (userId) => {
  console.log('🔍 Fetching online status for user:', userId);
  try {
    // If userId is a number/ID, use it directly, otherwise it might be email
    const response = await api.get('/chat/online');
    console.log('📡 Online users response:', response.data);
    
    // Check if the user is in the online list
    const isOnline = response.data.includes(parseInt(userId) || userId);
    
    return { 
      online: isOnline,
      last_seen: isOnline ? new Date().toISOString() : null
    };
  } catch (error) {
    console.error('❌ Error fetching online status:', error);
    return { online: false, last_seen: null };
  }
};

/**
 * Start a call in a specific room
 */
export const startCall = async (roomId) => {
  try {
    return await api.post(`/chat/rooms/${roomId}/call`);
  } catch (error) {
    console.error('Error starting call:', error);
    throw error;
  }
};

/**
 * Get messages for a specific room
 */
export const getRoomMessages = async (roomId) => {
  try {
    const response = await api.get(`/chat/rooms/${roomId}/messages`);
    return response.data;
  } catch (error) {
    console.error('Error fetching room messages:', error);
    throw error;
  }
};

/**
 * Send message to room - Using axios (recommended)
 * @param {string|number} roomId - ID of the room
 * @param {Object} data - Message data with content
 * @returns {Promise} - Sent message data
 */
export const sendMessageToRoom = async (roomId, data) => {
  try {
    console.log('Sending message to room:', roomId, 'Content:', data);
    
    if (!roomId) {
      throw new Error('Room ID is required');
    }
    
    const response = await api.post(`/chat/rooms/${roomId}/message`, {
      content: data.content
    });
    
    console.log('✅ Message sent:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error sending message:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
      
      throw new Error(error.response.data.detail || `Server error: ${error.response.status}`);
      
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Check if backend is running.');
      throw new Error('Cannot connect to server. Please check your connection.');
      
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

/**
 * Send a message to a room - Alias for sendMessageToRoom
 */
export const sendMessage = sendMessageToRoom;

/**
 * Get all chat rooms for the current user
 */
export const getChatRooms = async () => {
  try {
    const response = await api.get('/chat/rooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    throw error;
  }
};

/**
 * Get all users
 */
export const getUsers = async () => {
  try {
    const response = await api.get('/users/');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Add this function to get user profile - use /users/me endpoint
export const getUserProfile = async () => {
  try {
    console.log('Fetching user profile from:', API_URL + '/users/me');
    const token = localStorage.getItem("access_token");
    console.log('Token exists:', !!token);
    
    const response = await api.get('/users/me');
    console.log('Profile API response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    // Try alternative endpoints
    const endpoints = ['/users/profile', '/auth/me', '/user/profile'];
    
    for (const endpoint of endpoints) {
      try {
        console.log('Trying alternative endpoint:', endpoint);
        const response = await api.get(endpoint);
        console.log('Alternative response:', response.data);
        return response.data;
      } catch (altError) {
        console.log(`Endpoint ${endpoint} failed:`, altError.message);
      }
    }

    throw error;
  }
};

// --- Settings-related API calls ---

/**
 * Get all settings for the current user
 */
export const getMySettings = () => api.get('/settings/me');

/**
 * Updates any combination of settings globally.
 */
export const updateAllSettings = (payload) => api.patch('/settings/me', payload);

/**
 * Account Settings: Get and Update
 */
export const getAccountSettings = () => api.get('/settings/me/account');
export const updateAccountSettings = (payload) => api.patch('/settings/me/account', payload);

/**
 * General Settings: Get and Update
 */
export const getGeneralSettings = () => api.get('/settings/me/general');
export const updateGeneralSettings = (payload) => api.patch('/settings/me/general', payload);

/**
 * People Settings: Get and Update
 */
export const getPeopleSettings = () => api.get('/settings/me/people');
export const updatePeopleSettings = (payload) => api.patch('/settings/me/people', payload);

/**
 * Calendar Settings: Get and Update
 */
export const getCalendarSettings = () => api.get('/settings/me/calendar');
export const updateCalendarSettings = (payload) => api.patch('/settings/me/calendar', payload);

/**
 * Fetch account settings for the current user
 */
export const fetchAccountSettings = async (token) => {
  const response = await api.get('/settings/me/account', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Fetch general settings for the current user
 */
export const fetchGeneralSettings = async (token) => {
  try {
    const response = await api.get('/settings/me/general', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching general settings:', error);
    throw error;
  }
};

/**
 * Fetch people settings for the current user
 */
export const fetchPeopleSettings = async (token) => {
  const response = await api.get('/settings/me/people', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

/**
 * Update a people setting for the current user
 */
export const updatePeopleSetting = async (key, value, token) => {
  const response = await api.patch(
    '/settings/me/people',
    { [key]: value },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

/**
 * Search users by query string
 */
export const searchUsers = async (query) => {
  try {
    const response = await api.get('/users/search', {
      params: { q: query },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

// WebSocket connection for real-time status
let statusSocket = null;
let statusCallbacks = new Set();

export const connectStatusWebSocket = (userId, onStatusUpdate) => {
  if (!userId) return;
  
  const token = localStorage.getItem("access_token");
  if (!token) return;
  
  // Close existing connection
  if (statusSocket) {
    statusSocket.close();
  }
  
  // Add callback to set
  statusCallbacks.add(onStatusUpdate);
  
  // Create new connection
  const WS_BASE = import.meta.env.PROD
  ? `wss://${window.location.host}`
  : "ws://localhost:8000";
  // const wsUrl = `ws://localhost:8000/ws/${userId}?token=${token}`;
  const wsUrl = `${WS_BASE}/ws/${userId}?token=${token}`;
  statusSocket = new WebSocket(wsUrl);
  
  statusSocket.onopen = () => {
    console.log('Status WebSocket connected');
  };
  
  statusSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      // Notify all callbacks
      statusCallbacks.forEach(callback => callback(data));
    } catch (error) {
      console.error('Error parsing status message:', error);
    }
  };
  
  statusSocket.onerror = (error) => {
    console.error('Status WebSocket error:', error);
  };
  
  statusSocket.onclose = () => {
    console.log('Status WebSocket disconnected');
    // Attempt to reconnect after 5 seconds
    setTimeout(() => {
      connectStatusWebSocket(userId, onStatusUpdate);
    }, 5000);
  };
  
  return () => {
    statusCallbacks.delete(onStatusUpdate);
    if (statusCallbacks.size === 0 && statusSocket) {
      statusSocket.close();
      statusSocket = null;
    }
  };
};

// Chat service object
export const chatService = {
  searchChats,
  getOnlineStatus,
  startCall,
  getRoomMessages,
  getChatRooms,
  getUsers,
  createChatRoom,
  sendMessage: sendMessageToRoom,
  connectStatusWebSocket,
  sendMessageToRoom  
};


// --- Drive-related API calls ---

export const uploadDriveFile = (formData) => {
  return api.post("/drive/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getMyDriveFiles = () => api.get("/drive/my-files");

// New Endpoints for Favorites and Trash
export const toggleFavorite = (id) => api.patch(`/drive/${id}/favorite`);
export const getFavoriteFiles = () => api.get("/drive/favorites");
export const moveToTrash = (id) => api.delete(`/drive/${id}`);
export const getTrashFiles = () => api.get("/drive/trash");
export const restoreFile = (id) => api.patch(`/drive/${id}/restore`);

export { api };
