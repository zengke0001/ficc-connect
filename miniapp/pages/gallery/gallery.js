// pages/gallery/gallery.js
const { photoAPI, activityAPI } = require('../../utils/api');
const { showToast } = require('../../utils/util');

Page({
  data: {
    activityId: null,
    activity: null,
    photos: [],
    winners: [],
    stats: {},
    loading: true,
    isActivityGallery: false
  },

  onLoad(options) {
    if (options.activityId) {
      this.setData({ activityId: options.activityId, isActivityGallery: true });
      this.loadActivityGallery(options.activityId);
    } else {
      this.loadMyPhotos();
    }
  },

  async loadActivityGallery(activityId) {
    this.setData({ loading: true });
    try {
      const [galleryRes, activityRes] = await Promise.all([
        photoAPI.getGallery(activityId),
        activityAPI.getOne(activityId)
      ]);

      this.setData({
        photos: galleryRes.data.photos,
        winners: galleryRes.data.winners,
        stats: galleryRes.data.stats,
        activity: activityRes.data.activity,
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
      showToast('加载失败');
    }
  },

  async loadMyPhotos() {
    this.setData({ loading: true });
    // Load recent activity photos
    try {
      const activitiesRes = await activityAPI.list({ my_activities: true });
      const activities = activitiesRes.data.activities || [];
      this.setData({ activities, loading: false });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  async likePhoto(e) {
    const { photoId, isLiked } = e.currentTarget.dataset;
    try {
      const api = isLiked ? photoAPI.unlike : photoAPI.like;
      const result = await api(photoId);
      const photos = this.data.photos.map(p =>
        p.id === photoId
          ? { ...p, likes_count: result.data.likes_count, is_liked: !isLiked }
          : p
      );
      this.setData({ photos });
      if (!isLiked) wx.vibrateShort({ type: 'light' });
    } catch (e) {
      showToast('操作失败');
    }
  },

  previewPhoto(e) {
    const { url } = e.currentTarget.dataset;
    const urls = this.data.photos.map(p => p.url);
    wx.previewImage({ current: url, urls });
  },

  goToActivityGallery(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/gallery/gallery?activityId=${id}` });
  }
});
