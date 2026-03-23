// pages/onboarding/onboarding.js
const { authAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    loading: false,
    step: 0,  // 0=login, 1=register, 2=team-select
    // Login form
    loginEmail: '',
    // Register form
    email: '',
    nickname: '',
    inviteCode: '',
    // Team selection
    teams: [],
    selectedTeamId: null
  },

  onLoad(options) {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.reLaunch({ url: '/pages/home/home' });
      return;
    }
    // Auto-fill invite code from scene parameter
    if (options && options.invite_code) {
      this.setData({ inviteCode: options.invite_code.toUpperCase() });
    }
  },

  // --- Input handlers ---
  onLoginEmailInput(e) {
    this.setData({ loginEmail: e.detail.value });
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onInviteCodeInput(e) {
    this.setData({ inviteCode: e.detail.value.toUpperCase() });
  },

  // --- Navigation between steps ---
  goToRegister() {
    this.setData({ step: 1 });
  },

  goToLogin() {
    this.setData({ step: 0 });
  },

  // --- Login ---
  async handleLogin() {
    if (this.data.loading) return;

    const { loginEmail } = this.data;
    if (!loginEmail || !loginEmail.trim()) {
      showToast('Please enter your email');
      return;
    }

    this.setData({ loading: true });
    showLoading('Signing in...');

    try {
      const result = await authAPI.login(loginEmail.trim());

      const app = getApp();
      app.setToken(result.data.token);
      app.setUserInfo(result.data.user);
      wx.setStorageSync('user_email', loginEmail.trim());

      hideLoading();

      if (!result.data.user.team_id) {
        await this.loadTeams();
        this.setData({ step: 2, loading: false });
      } else {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    } catch (error) {
      console.error('Login error:', error);
      hideLoading();
      this.setData({ loading: false });
      showToast(error.message || 'Login failed');
    }
  },

  // --- Register ---
  async handleRegister() {
    if (this.data.loading) return;

    const { email, nickname, inviteCode } = this.data;

    if (!email || !email.trim()) {
      showToast('Please enter your email');
      return;
    }
    if (!inviteCode || !inviteCode.trim()) {
      showToast('Please enter the invite code');
      return;
    }

    this.setData({ loading: true });
    showLoading('Creating account...');

    try {
      const result = await authAPI.register({
        email: email.trim(),
        invite_code: inviteCode.trim(),
        nickname: (nickname && nickname.trim()) || email.trim().split('@')[0]
      });

      const app = getApp();
      app.setToken(result.data.token);
      app.setUserInfo(result.data.user);
      wx.setStorageSync('user_email', email.trim());

      hideLoading();

      // New user -> pick team
      await this.loadTeams();
      this.setData({ step: 2, loading: false });
    } catch (error) {
      console.error('Register error:', error);
      hideLoading();
      this.setData({ loading: false });
      showToast(error.message || 'Registration failed');
    }
  },

  // --- Team selection ---
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
  },

  skipTeam() {
    wx.reLaunch({ url: '/pages/home/home' });
  }
});
