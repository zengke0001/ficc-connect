const BASE_URL = import.meta.env.VITE_API_URL || '';

class API {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `${BASE_URL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      }
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async upload(endpoint, file, additionalData = {}) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('photo', file);

    Object.entries(additionalData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }
}

export const api = new API();

// Auth API
export const authAPI = {
  wechatLogin: (code, nickname, avatarUrl) =>
    api.post('/api/auth/wechat', { code, nickname, avatar_url: avatarUrl }),
  login: (email) => api.post('/api/auth/login', { email }),
  register: (data) => api.post('/api/auth/register', data),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  getTeams: () => api.get('/api/auth/teams'),
  getInviteCode: () => api.get('/api/auth/invite-code')
};

// Activities API
export const activityAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/activities?${query}`);
  },
  getOne: (id) => api.get(`/api/activities/${id}`),
  create: (data) => api.post('/api/activities', data),
  join: (id) => api.post(`/api/activities/${id}/join`, {}),
  leave: (id) => api.post(`/api/activities/${id}/leave`, {}),
  getLeaderboard: (id, type = 'overall') =>
    api.get(`/api/activities/${id}/leaderboard?type=${type}`),
  checkin: (id, data) => api.post(`/api/activities/${id}/checkin`, data),
  getCheckins: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/activities/${id}/checkins?${query}`);
  },
  getTodayStatus: () => api.get('/api/activities/today')
};

// Photos API
export const photoAPI = {
  upload: (file, activityId, checkinId) =>
    api.upload('/api/photos/upload', file, { activityId, checkinId }),
  uploadGeneral: (file) =>
    api.upload('/api/photos/upload-general', file),
  getActivityPhotos: (activityId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/api/photos/activity/${activityId}?${query}`);
  },
  getGallery: (activityId) => api.get(`/api/photos/gallery/${activityId}`),
  like: (photoId) => api.post(`/api/photos/${photoId}/like`, {}),
  unlike: (photoId) => api.delete(`/api/photos/${photoId}/like`)
};
