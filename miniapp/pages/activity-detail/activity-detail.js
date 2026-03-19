// pages/activity-detail/activity-detail.js
const { activityAPI, photoAPI } = require('../../utils/api');
const { formatDateRange, getRankMedal, showToast, showLoading, hideLoading, showConfirm } = require('../../utils/util');

Page({
  data: {
    id: null,
    activity: null,
    isJoined: false,
    userParticipant: null,
    leaderboard: [],
    recentPhotos: [],
    leaderboardType: 'overall',
    loading: true
  },

  onLoad(options) {
    this.setData({ id: options.id });
    this.loadDetail(options.id);
  },

  onShow() {
    if (this.data.id) this.loadDetail(this.data.id);
  },

  async loadDetail(id) {
    this.setData({ loading: true });
    try {
      const result = await activityAPI.getOne(id);
      const { activity, isJoined, userParticipant, leaderboard, recentPhotos } = result.data;

      this.setData({
        activity,
        isJoined,
        userParticipant,
        leaderboard: leaderboard.map((item, i) => ({
          ...item,
          medal: getRankMedal(item.rank)
        })),
        recentPhotos,
        loading: false
      });

      wx.setNavigationBarTitle({ title: activity.title });
    } catch (error) {
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  async joinActivity() {
    showLoading('加入中...');
    try {
      await activityAPI.join(this.data.id);
      hideLoading();
      showToast('加入成功！🎉');
      this.loadDetail(this.data.id);
    } catch (error) {
      hideLoading();
      showToast(error.message || '加入失败');
    }
  },

  goToCheckin() {
    wx.navigateTo({ url: `/pages/checkin/checkin?activityId=${this.data.id}` });
  },

  async switchLeaderboard(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ leaderboardType: type });
    try {
      const result = await activityAPI.getLeaderboard(this.data.id, type);
      this.setData({
        leaderboard: result.data.rankings.map(item => ({
          ...item,
          medal: getRankMedal(item.rank)
        }))
      });
    } catch (e) { showToast('加载失败'); }
  },

  goToLeaderboard() {
    wx.navigateTo({ url: `/pages/leaderboard/leaderboard?activityId=${this.data.id}` });
  },

  goToGallery() {
    wx.navigateTo({ url: `/pages/gallery/gallery?activityId=${this.data.id}` });
  },

  goToCheckins() {
    wx.navigateTo({ url: `/pages/checkin/checkin?activityId=${this.data.id}` });
  },

  likePhoto(e) {
    const { photoId, isLiked } = e.currentTarget.dataset;
    const api = isLiked ? photoAPI.unlike : photoAPI.like;
    api(photoId).then(result => {
      const photos = this.data.recentPhotos.map(p =>
        p.id === photoId
          ? { ...p, likes_count: result.data.likes_count, is_liked: !isLiked }
          : p
      );
      this.setData({ recentPhotos: photos });
    }).catch(() => showToast('操作失败'));
  }
});
