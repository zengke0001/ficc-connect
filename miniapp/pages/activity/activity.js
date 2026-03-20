// pages/activity/activity.js
const { activityAPI } = require('../../utils/api');
const { daysRemaining, showToast } = require('../../utils/util');

Page({
  data: {
    tab: 'active',  // active | archived
    activities: [],
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad(options) {
    if (options.status === 'archived') this.setData({ tab: 'archived' });
    this.loadActivities(true);
  },

  onShow() {
    // Refresh when returning to page
    this.loadActivities(true);
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === this.data.tab) return;
    this.setData({ tab, activities: [], page: 1, hasMore: true });
    this.loadActivities(true);
  },

  async loadActivities(reset = false) {
    if (!this.data.hasMore && !reset) return;

    const page = reset ? 1 : this.data.page;
    this.setData({ loading: reset });

    try {
      const status = this.data.tab === 'archived' ? 'completed' : 'active';
      const result = await activityAPI.list({ status, page, limit: 10 });

      const newActivities = (result.data.activities || []).map(a => ({
        ...a,
        daysLeft: daysRemaining(a.end_date)
      }));

      this.setData({
        activities: reset ? newActivities : [...this.data.activities, ...newActivities],
        page: page + 1,
        hasMore: newActivities.length === 10,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      showToast('Failed to load');
    }
  },

  goToDetail(e) {
    wx.navigateTo({ url: `/pages/activity-detail/activity-detail?id=${e.currentTarget.dataset.id}` });
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/create-activity/create-activity' });
  },

  onReachBottom() {
    this.loadActivities(false);
  },

  onPullDownRefresh() {
    this.loadActivities(true).then(() => wx.stopPullDownRefresh());
  }
});
