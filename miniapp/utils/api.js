// utils/api.js - Centralized API calls
const { request, uploadFile } = require('./request');

// Auth
const authAPI = {
  wechatLogin: (code, nickname, avatarUrl) =>
    request('/api/auth/wechat', {
      method: 'POST',
      data: { code, nickname, avatar_url: avatarUrl }
    }),
  login: (email) =>
    request('/api/auth/login', { method: 'POST', data: { email } }),
  register: (data) =>
    request('/api/auth/register', { method: 'POST', data }),
  getProfile: () => request('/api/auth/profile'),
  updateProfile: (data) => request('/api/auth/profile', { method: 'PUT', data }),
  getTeams: () => request('/api/auth/teams')
};

// Activities
const activityAPI = {
  list: (params) => request('/api/activities?' + buildQuery(params)),
  getOne: (id) => request(`/api/activities/${id}`),
  create: (data) => request('/api/activities', { method: 'POST', data }),
  join: (id) => request(`/api/activities/${id}/join`, { method: 'POST' }),
  leave: (id) => request(`/api/activities/${id}/leave`, { method: 'POST' }),
  getLeaderboard: (id, type) => request(`/api/activities/${id}/leaderboard?type=${type || 'overall'}`),
  checkin: (id, data) => request(`/api/activities/${id}/checkin`, { method: 'POST', data }),
  getCheckins: (id, params) => request(`/api/activities/${id}/checkins?${buildQuery(params)}`),
  getTodayStatus: () => request('/api/activities/today')
};

// Photos
const photoAPI = {
  upload: (filePath, activityId, checkinId) =>
    uploadFile('/api/photos/upload', filePath, { activityId, checkinId }),
  getActivityPhotos: (activityId, params) =>
    request(`/api/photos/activity/${activityId}?${buildQuery(params)}`),
  getGallery: (activityId) => request(`/api/photos/gallery/${activityId}`),
  like: (photoId) => request(`/api/photos/${photoId}/like`, { method: 'POST' }),
  unlike: (photoId) => request(`/api/photos/${photoId}/like`, { method: 'DELETE' })
};

// Helpers
const buildQuery = (params = {}) => {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
};

module.exports = { authAPI, activityAPI, photoAPI };
