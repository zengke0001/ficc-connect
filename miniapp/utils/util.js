// utils/util.js

// Format date to readable string
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Format date range
const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} - ${fmt(end)}`;
};

// Days remaining in activity
const daysRemaining = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / 86400000);
  if (diff <= 0) return '已结束';
  if (diff === 1) return '最后1天';
  return `还剩${diff}天`;
};

// Format large numbers
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return String(num);
};

// Get streak flame level
const getStreakFlame = (streak) => {
  if (streak >= 30) return '🔥🔥🔥';
  if (streak >= 14) return '🔥🔥';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '✨';
  return '';
};

// Get rank medal
const getRankMedal = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `${rank}`;
};

// Show toast
const showToast = (title, icon = 'none', duration = 2000) => {
  wx.showToast({ title, icon, duration });
};

// Show loading
const showLoading = (title = '加载中...') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => wx.hideLoading();

// Confirm dialog
const showConfirm = (title, content) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title, content,
      confirmColor: '#2563EB',
      success: (res) => res.confirm ? resolve() : reject(new Error('cancelled'))
    });
  });
};

module.exports = {
  formatDate,
  formatDateRange,
  daysRemaining,
  formatNumber,
  getStreakFlame,
  getRankMedal,
  showToast,
  showLoading,
  hideLoading,
  showConfirm
};
