// utils/request.js

const request = (url, options = {}) => {
  const app = getApp();
  const token = wx.getStorageSync('token');
  const baseUrl = app.globalData.baseUrl;

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
      },
      success: (res) => {
        if (res.statusCode === 401) {
          // Token expired, redirect to onboarding
          app.clearAuth();
          wx.reLaunch({ url: '/pages/onboarding/onboarding' });
          reject(new Error('Unauthorized'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || `HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || 'Network error'));
      }
    });
  });
};

const uploadFile = (url, filePath, formData = {}) => {
  const app = getApp();
  const token = wx.getStorageSync('token');
  const baseUrl = app.globalData.baseUrl;

  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${baseUrl}${url}`,
      filePath,
      name: 'photo',
      formData,
      header: { 'Authorization': `Bearer ${token}` },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(data?.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      },
      fail: (err) => reject(new Error(err.errMsg || 'Upload failed'))
    });
  });
};

module.exports = { request, uploadFile };
