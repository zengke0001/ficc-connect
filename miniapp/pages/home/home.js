// pages/home/home.js
const { activityAPI } = require('../../utils/api');
const { formatDateRange, daysRemaining, getStreakFlame, showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    userInfo: null,
    todayActivities: [],
    loading: true,
    archivedCount: 0,
    totalStreak: 0
  },

  onLoad() {
    const app = getApp();
    if (!app.checkAuth()) return;
    this.setData({ userInfo: app.globalData.userInfo });
  },

  onShow() {
    const app = getApp();
    if (!app.globalData.token) return;
    this.setData({ userInfo: app.globalData.userInfo });
    this.loadTodayStatus();
  },

  async loadTodayStatus() {
    this.setData({ loading: true });
    try {
      const result = await activityAPI.getTodayStatus();
      const activities = result.data.activities || [];

      // Calculate max streak across all activities
      const maxStreak = activities.reduce((max, a) => Math.max(max, a.current_streak || 0), 0);

      this.setData({
        todayActivities: activities.map(a => ({
          ...a,
          streakFlame: getStreakFlame(a.current_streak),
          daysLeft: daysRemaining(a.end_date)
        })),
        totalStreak: maxStreak,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  goToCheckin(e) {
    const { activityId, checkinId, hasCheckin } = e.currentTarget.dataset;
    if (hasCheckin) {
      showToast('今日已打卡 ✓');
      return;
    }
    wx.navigateTo({ url: `/pages/checkin/checkin?activityId=${activityId}` });
  },

  goToActivityDetail(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${id}` });
  },

  goToDiscover() {
    wx.switchTab({ url: '/pages/activity/activity' });
  },

  goToArchived() {
    wx.navigateTo({ url: '/pages/activity/activity?status=archived' });
  },

  goToProfile() {
    wx.switchTab({ url: '/pages/profile/profile' });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/create-activity/create-activity' });
  },

  goToGallery() {
    wx.switchTab({ url: '/pages/gallery/gallery' });
  },

  onPullDownRefresh() {
    this.loadTodayStatus().then(() => wx.stopPullDownRefresh());
  }
});
