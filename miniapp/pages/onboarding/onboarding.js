// pages/onboarding/onboarding.js
const { authAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    loading: false,
    step: 0  // 0=welcome, 1=team-select
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  async handleLogin() {
    if (this.data.loading) return;
    
    try {
      // Step 1: Get user profile FIRST (must be called directly from tap)
      const profileRes = await new Promise((resolve, reject) => {
        wx.getUserProfile({
          desc: '用于展示您的头像和昵称',
          success: resolve,
          fail: reject
        });
      });

      const { nickName, avatarUrl } = profileRes.userInfo;

      // Step 2: Get WeChat login code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });

      showLoading('登录中...');

      // Step 3: Login with backend
      const result = await authAPI.wechatLogin(loginRes.code, nickName, avatarUrl);

      const app = getApp();
      app.setToken(result.data.token);
      app.setUserInfo(result.data.user);

      hideLoading();

      // New user → pick team, existing user → go home
      if (result.data.isNewUser || !result.data.user.team_id) {
        await this.loadTeams();
        this.setData({ step: 1, loading: false });
      } else {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message !== 'cancel') {
        showToast('登录失败，请重试');
      }
    }
  },

  async loadTeams() {
    const result = await authAPI.getTeams();
    this.setData({ teams: result.data.teams, selectedTeamId: null });
  },

  selectTeam(e) {
    this.setData({ selectedTeamId: e.currentTarget.dataset.id });
  },

  async confirmTeam() {
    if (!this.data.selectedTeamId) {
      showToast('请选择您的部门');
      return;
    }

    showLoading('保存中...');
    try {
      await authAPI.updateProfile({ team_id: this.data.selectedTeamId });
      const profile = await authAPI.getProfile();
      getApp().setUserInfo(profile.data.user);
      hideLoading();
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (error) {
      hideLoading();
      showToast('保存失败，请重试');
    }
  }
});
