// pages/checkin/checkin.js
const { activityAPI, photoAPI } = require('../../utils/api');
const { showToast, showLoading, hideLoading } = require('../../utils/util');

Page({
  data: {
    activityId: null,
    activity: null,
    photoPath: null,
    comment: '',
    submitting: false,
    showSuccess: false,
    successData: null
  },

  onLoad(options) {
    const app = getApp();
    if (!app.checkAuth()) return;
    this.setData({ activityId: options.activityId });
    this.loadActivity(options.activityId);
  },

  async loadActivity(id) {
    try {
      const result = await activityAPI.getOne(id);
      this.setData({ activity: result.data.activity });
    } catch (e) {
      showToast('加载失败');
    }
  },

  async choosePhoto() {
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: ['album', 'camera'],
          sizeType: ['compressed'],
          success: resolve,
          fail: reject
        });
      });

      if (res.tempFiles && res.tempFiles.length > 0) {
        this.setData({ photoPath: res.tempFiles[0].tempFilePath });
      }
    } catch (e) {
      if (e.errMsg && !e.errMsg.includes('cancel')) {
        showToast('选择图片失败');
      }
    }
  },

  removePhoto() {
    this.setData({ photoPath: null });
  },

  onCommentInput(e) {
    this.setData({ comment: e.detail.value });
  },

  async submit() {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    showLoading('打卡中...');

    try {
      // 1. Submit check-in
      const checkinResult = await activityAPI.checkin(this.data.activityId, {
        comment: this.data.comment
      });

      const { checkin, streak, pointsEarned, streakBonus, newAchievements } = checkinResult.data;

      // 2. Upload photo if selected
      if (this.data.photoPath) {
        try {
          await photoAPI.upload(this.data.photoPath, this.data.activityId, checkin.id);
        } catch (e) {
          // Photo upload failed but check-in succeeded
          showToast('打卡成功，照片上传失败');
        }
      }

      hideLoading();

      // Show success animation
      this.setData({
        submitting: false,
        showSuccess: true,
        successData: {
          streak,
          pointsEarned,
          streakBonus,
          newAchievements: newAchievements || []
        }
      });

      // Animate confetti via wx.vibrateShort
      wx.vibrateShort({ type: 'heavy' });

    } catch (error) {
      hideLoading();
      this.setData({ submitting: false });
      showToast(error.message || '打卡失败，请重试');
    }
  },

  goBack() {
    wx.navigateBack();
  }
});
