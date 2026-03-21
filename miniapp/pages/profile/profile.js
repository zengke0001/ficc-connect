// pages/profile/profile.js
const { authAPI } = require('../../utils/api');
const { formatDate, showToast, showLoading, hideLoading, showConfirm } = require('../../utils/util');

Page({
  data: {
    user: null,
    stats: null,
    achievements: [],
    loading: true,
    showNicknameModal: false,
    editNickname: ''
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
      showToast('Failed to load');
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
      showToast('Avatar update coming soon');
    } catch (e) { }
  },

  editNickname() {
    this.setData({ 
      showNicknameModal: true,
      editNickname: this.data.user?.nickname || ''
    });
  },

  closeNicknameModal() {
    this.setData({ showNicknameModal: false });
  },

  onEditNicknameInput(e) {
    this.setData({ editNickname: e.detail.value });
  },

  async saveNickname() {
    const { editNickname } = this.data;
    
    if (!editNickname || !editNickname.trim()) {
      showToast('Please enter a nickname');
      return;
    }

    showLoading('Saving...');
    try {
      await authAPI.updateProfile({ nickname: editNickname.trim() });
      const profile = await authAPI.getProfile();
      
      this.setData({
        user: profile.data.user,
        showNicknameModal: false
      });
      
      // Update global data
      getApp().setUserInfo(profile.data.user);
      
      hideLoading();
      showToast('Nickname updated!');
    } catch (e) {
      hideLoading();
      showToast('Failed to save');
    }
  },

  async logout() {
    try {
      await showConfirm('Log Out', 'Are you sure you want to log out?');
      getApp().clearAuth();
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
    } catch (e) { }
  },

  goToArchived() {
    wx.navigateTo({ url: '/pages/activity/activity?status=archived' });
  }
});
