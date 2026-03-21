// app.js

App({
  globalData: {
    userInfo: null,
    token: null,
    // TODO: Replace with your deployed backend URL before release
    // For local dev use your machine's LAN IP e.g. http://192.168.1.x:3001
    baseUrl: 'https://cranker.tdxo.cn:8443'
  },

  onLaunch() {
    // Restore token from storage
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  onShow() {
    // Auto archive completed activities (backend handles, just trigger)
  },

  // Check if user is logged in and redirect to onboarding if not
  checkAuth() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.reLaunch({ url: '/pages/onboarding/onboarding' });
      return false;
    }
    return true;
  },

  // Update user info in global data and storage
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  // Set auth token
  setToken(token) {
    this.globalData.token = token;
    wx.setStorageSync('token', token);
  },

  // Clear auth (logout)
  clearAuth() {
    this.globalData.token = null;
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
  }
});
