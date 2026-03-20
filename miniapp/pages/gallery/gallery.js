// pages/gallery/gallery.js
const { activityAPI } = require('../../utils/api');
const { showToast } = require('../../utils/util');

Page({
  data: {
    activities: [],
    loading: true
  },

  onLoad() {
    console.log('Gallery tab page loaded');
  },

  onShow() {
    // Reload data every time the tab is shown
    this.loadActivities();
  },

  async loadActivities() {
    this.setData({ loading: true });
    try {
      const activitiesRes = await activityAPI.list({ my_activities: true });
      console.log('Activities response:', activitiesRes);
      const activities = activitiesRes.data.activities || [];
      
      this.setData({ 
        activities: activities.map(a => ({
          ...a,
          participant_count: a.participant_count || 0
        })), 
        loading: false 
      });
    } catch (e) {
      console.error('Load activities error:', e);
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  goToActivityGallery(e) {
    const { id } = e.currentTarget.dataset;
    console.log('Navigating to activity gallery:', id);
    wx.navigateTo({ url: `/pages/activity-gallery/activity-gallery?activityId=${id}` });
  },

  onPullDownRefresh() {
    this.loadActivities().then(() => wx.stopPullDownRefresh());
  }
});
