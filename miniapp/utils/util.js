// utils/util.js

// Format date to readable string
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

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

// Format date period in friendly way (e.g., "Mar 1 - Mar 31")
const formatDatePeriod = (startDate, endDate) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = months[start.getMonth()];
  const startDay = start.getDate();
  const endMonth = months[end.getMonth()];
  const endDay = end.getDate();
  
  // Same month
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay} - ${endDay}`;
  }
  // Different months
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
};

// Get activity progress info
const getActivityProgress = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  
  // Reset time to midnight for accurate day calculation
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  now.setHours(0, 0, 0, 0);
  
  const totalDays = Math.ceil((end - start) / 86400000) + 1;
  
  if (now < start) {
    const daysToStart = Math.ceil((start - now) / 86400000);
    return { 
      status: 'upcoming', 
      text: `Starts in ${daysToStart} day${daysToStart > 1 ? 's' : ''}`,
      progress: 0,
      totalDays,
      currentDay: 0
    };
  }
  
  if (now > end) {
    return { 
      status: 'ended', 
      text: 'Ended',
      progress: 100,
      totalDays,
      currentDay: totalDays
    };
  }
  
  const currentDay = Math.ceil((now - start) / 86400000) + 1;
  const progress = Math.round((currentDay / totalDays) * 100);
  const daysLeft = Math.ceil((end - now) / 86400000);
  
  return { 
    status: 'active', 
    text: daysLeft === 0 ? 'Last day' : daysLeft === 1 ? 'Ends tomorrow' : `${daysLeft} days left`,
    progress,
    totalDays,
    currentDay,
    dayText: `Day ${currentDay}`
  };
};

// Days remaining in activity
const daysRemaining = (endDate) => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = Math.ceil((end - now) / 86400000);
  if (diff <= 0) return 'Ended';
  if (diff === 1) return 'Last day';
  return `${diff}d left`;
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
const showLoading = (title = 'Loading...') => {
  wx.showLoading({ title, mask: true });
};

const hideLoading = () => wx.hideLoading();

// Confirm dialog
const showConfirm = (title, content) => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title, content,
      confirmColor: '#FF6B35',
      success: (res) => res.confirm ? resolve() : reject(new Error('cancelled'))
    });
  });
};

module.exports = {
  formatDate,
  formatDateRange,
  formatDatePeriod,
  getActivityProgress,
  daysRemaining,
  formatNumber,
  getStreakFlame,
  getRankMedal,
  showToast,
  showLoading,
  hideLoading,
  showConfirm
};
