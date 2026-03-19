// pages/leaderboard/leaderboard.js
const { activityAPI } = require('../../utils/api');
const { getRankMedal, showToast } = require('../../utils/util');

Page({
  data: {
    activityId: null,
    type: 'overall',
    rankings: [],
    myRank: null,
    loading: true
  },

  onLoad(options) {
    this.setData({ activityId: options.activityId });
    this.loadLeaderboard('overall');
  },

  async loadLeaderboard(type) {
    this.setData({ loading: true, type });
    try {
      const userId = getApp().globalData.userInfo?.id;
      const result = await activityAPI.getLeaderboard(this.data.activityId, type);
      const rankings = result.data.rankings.map(item => ({
        ...item,
        medal: getRankMedal(item.rank),
        isMe: item.id === userId
      }));

      const myRank = rankings.find(r => r.isMe);
      this.setData({ rankings, myRank, loading: false });
    } catch (e) {
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.loadLeaderboard(type);
  }
});
