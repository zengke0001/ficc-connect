// pages/create-activity/create-activity.js
const { activityAPI, photoAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    form: {
      title: '',
      description: '',
      start_date: '',
      end_date: '',
      points_per_checkin: 10,
      points_per_photo: 5
    },
    coverPath: null,
    submitting: false,
    minDate: new Date().toISOString().slice(0, 10)
  },

  onLoad() {
    const app = getApp();
    if (!app.checkAuth()) return;
    // Set default dates
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    this.setData({
      'form.start_date': today.toISOString().slice(0, 10),
      'form.end_date': nextMonth.toISOString().slice(0, 10)
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async chooseCover() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
          sizeType: ['compressed'], success: resolve, fail: reject
        });
      });
      if (res.tempFiles.length > 0) {
        this.setData({ coverPath: res.tempFiles[0].tempFilePath });
      }
    } catch (e) { }
  },

  async submit() {
    const { form, coverPath } = this.data;
    if (!form.title.trim()) { showToast('请输入活动标题'); return; }
    if (!form.description.trim()) { showToast('请输入活动描述'); return; }
    if (!form.start_date || !form.end_date) { showToast('请选择活动时间'); return; }
    if (form.end_date < form.start_date) { showToast('结束时间不能早于开始时间'); return; }

    this.setData({ submitting: true });
    showLoading('发布中...');

    try {
      let coverImageUrl = null;

      // Upload cover image first if selected
      if (coverPath) {
        const uploadRes = await photoAPI.upload(coverPath, null, null);
        coverImageUrl = uploadRes.data?.photo?.url;
      }

      const result = await activityAPI.create({
        ...form,
        cover_image_url: coverImageUrl
      });

      hideLoading();
      wx.vibrateShort({ type: 'medium' });
      showToast('活动发布成功！🎉');

      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/activity-detail/activity-detail?id=${result.data.activity.id}`
        });
      }, 1000);
    } catch (error) {
      hideLoading();
      this.setData({ submitting: false });
      showToast(error.message || '发布失败，请重试');
    }
  }
});
