// pages/activity-gallery/activity-gallery.js
const { photoAPI, activityAPI } = require('../../utils/api');
const { showToast } = require('../../utils/util');

Page({
  data: {
    activityId: null,
    activity: null,
    photos: [],
    winners: [],
    stats: {},
    loading: true
  },

  onLoad(options) {
    console.log('Activity gallery loaded with options:', options);
    if (options.activityId) {
      this.setData({ activityId: options.activityId });
      this.loadActivityGallery(options.activityId);
    } else {
      showToast('Missing activity ID');
      wx.navigateBack();
    }
  },

  async loadActivityGallery(activityId) {
    this.setData({ loading: true });
    try {
      const [galleryRes, activityRes] = await Promise.all([
        photoAPI.getGallery(activityId),
        activityAPI.getOne(activityId)
      ]);

      console.log('Gallery response:', galleryRes);
      console.log('Activity response:', activityRes);

      this.setData({
        photos: galleryRes.data.photos || [],
        winners: galleryRes.data.winners || [],
        stats: galleryRes.data.stats || {},
        activity: activityRes.data.activity,
        loading: false
      });
    } catch (e) {
      console.error('Gallery load error:', e);
      this.setData({ 
        photos: [], 
        winners: [], 
        stats: {}, 
        loading: false 
      });
      showToast('Failed to load');
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
      if (!isLiked && wx.vibrateShort) {
        wx.vibrateShort({ type: 'light', fail: () => {} });
      }
    } catch (e) {
      showToast('Failed');
    }
  },

  previewPhoto(e) {
    const { url } = e.currentTarget.dataset;
    
    if (!url) {
      showToast('Invalid image URL');
      return;
    }
    const urls = this.data.photos.map(p => p.url);
    const currentIndex = urls.indexOf(url);
    
    wx.previewImage({ 
      current: currentIndex >= 0 ? currentIndex : url, 
      urls,
      fail: (err) => {
        console.error('Preview failed:', err);
        showToast('Preview failed, please try again');
      }
    });
  }
});
