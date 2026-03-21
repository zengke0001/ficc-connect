// pages/onboarding/onboarding.js
const { authAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    loading: false,
    step: 0,  // 0=welcome, 1=team-select
    avatarUrl: '',
    nickname: ''
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
    }
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    console.log('Chosen avatar:', avatarUrl);
    this.setData({ avatarUrl });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onNicknameBlur(e) {
    console.log('Nickname:', e.detail.value);
  },

  async handleLogin() {
    if (this.data.loading) return;
    
    const { avatarUrl, nickname } = this.data;
    
    if (!avatarUrl) {
      showToast('Please select an avatar');
      return;
    }
    
    try {
      // Get WeChat login code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });
      
      console.log('Got WeChat code:', loginRes.code);

      showLoading('Logging in...');

      // Use provided nickname or generate a default one
      const finalNickname = nickname && nickname.trim() 
        ? nickname.trim() 
        : 'User_' + Math.random().toString(36).substring(2, 8);
      
      console.log('Calling authAPI.wechatLogin with:', { 
        code: loginRes.code, 
        nickname: finalNickname, 
        avatarUrl 
      });
      
      const result = await authAPI.wechatLogin(loginRes.code, finalNickname, avatarUrl);
      console.log('Backend response:', result);

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
      hideLoading();
      this.setData({ loading: false });
      showToast('Login failed: ' + (error.message || 'Unknown error'));
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
      showToast('Please select your team');
      return;
    }

    showLoading('Saving...');
    try {
      await authAPI.updateProfile({ team_id: this.data.selectedTeamId });
      const profile = await authAPI.getProfile();
      getApp().setUserInfo(profile.data.user);
      hideLoading();
      wx.reLaunch({ url: '/pages/home/home' });
    } catch (error) {
      hideLoading();
      showToast('Failed to save, please try again');
    }
  }
});
