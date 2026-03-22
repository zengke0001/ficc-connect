// Parse date string to Date object (handles timezone issues)
function parseDate(dateString) {
  if (!dateString) return null;

  // If it's already a Date object, return it
  if (dateString instanceof Date) return dateString;

  // Handle ISO date strings (e.g., "2025-03-21T00:00:00.000Z")
  if (dateString.includes('T')) {
    const date = new Date(dateString);
    // Adjust for timezone to get the correct local date
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + timezoneOffset);
  }

  // Handle date-only strings (e.g., "2025-03-21")
  // Parse as local date to avoid timezone shifts
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format date range
export function formatDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);

  if (!start || !end) return '';

  const format = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${format(start)}-${String(end.getDate()).padStart(2, '0')}`;
    }
    return `${format(start)} - ${format(end)}`;
  }

  return `${format(start)} - ${format(end)}`;
}

// Calculate days remaining
export function daysRemaining(endDate) {
  const end = parseDate(endDate);
  if (!end) return 0;

  const now = new Date();
  // Reset time to midnight for accurate day calculation
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDateOnly = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diff = Math.ceil((endDateOnly - nowDate) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// Get streak flame emoji based on streak count
export function getStreakFlame(streak) {
  if (streak >= 30) return '🔥🔥🔥';
  if (streak >= 14) return '🔥🔥';
  if (streak >= 7) return '🔥';
  if (streak >= 3) return '⚡';
  return '';
}

// Format relative time
export function formatRelativeTime(dateString) {
  const date = parseDate(dateString);
  if (!date) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Use consistent date format
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

// Format number with commas
export function formatNumber(num) {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0';
}

// Truncate text
export function truncate(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Get initials from name
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// Generate random color for avatar
export function getAvatarColor(name) {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500'
  ];

  let hash = 0;
  for (let i = 0; i < name?.length || 0; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Debounce function
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Check if element is in viewport
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}
