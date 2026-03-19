// pages/profile/profile.js
const { authAPI } = require('../../utils/api');
const { formatDate, showToast, showLoading, hideLoading, showConfirm } = require('../../utils/util');

Page({
  data: {
    user: null,
    stats: null,
    achievements: [],
    loading: true
  },

  onShow() {
    const app = getApp();
    if (!app.checkAuth()) return;
    this.loadProfile();
  },

  async loadProfile() {
    this.setData({ loading: true });
    try {
      const result = await authAPI.getProfile();
      this.setData({
        user: result.data.user,
        stats: result.data.stats,
        achievements: result.data.achievements || [],
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  async updateAvatar() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
          sizeType: ['compressed'], success: resolve, fail: reject
        });
      });
      // In a real app, upload the avatar image here
      showToast('头像更新功能开发中');
    } catch (e) { }
  },

  async logout() {
    try {
      await showConfirm('退出登录', '确定要退出登录吗？');
      getApp().clearAuth();
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
    } catch (e) { }
  },

  goToArchived() {
    wx.navigateTo({ url: '/pages/activity/activity?status=archived' });
  }
});
