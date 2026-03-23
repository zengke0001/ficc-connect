import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PhotoGrid } from '../components/PhotoGrid';
import { activityAPI, photoAPI } from '../utils/api';
import { ImageIcon, ChevronRight, Loader2, Filter, Calendar } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Archived' },
];

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [{ value: '', label: 'All Years' }];
  for (let y = currentYear; y >= currentYear - 4; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

export function Gallery() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  useEffect(() => {
    loadActivities();
  }, [statusFilter, yearFilter]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const params = { limit: 50, include_all: 'true' };
      if (statusFilter) params.status = statusFilter;
      if (yearFilter) params.year = yearFilter;

      const result = await activityAPI.list(params);
      setActivities(result.data.activities || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const yearOptions = getYearOptions();

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
        <p className="text-gray-500 mt-1">Photos from all activities</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
        {/* Status Filter */}
        <div className="flex bg-gray-100 rounded-lg p-1 shrink-0">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                statusFilter === opt.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Year Filter */}
        <div className="relative shrink-0">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="appearance-none bg-gray-100 rounded-lg pl-9 pr-8 py-2 text-sm font-medium text-gray-700 border-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          >
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Activity Galleries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-6">
          {activities.map((activity) => (
            <ActivityGalleryPreview key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">No galleries found</h3>
          <p className="text-sm text-gray-500">
            {statusFilter || yearFilter
              ? 'Try adjusting your filters'
              : 'Activities with photos will appear here'}
          </p>
        </div>
      )}
    </div>
  );
}

function ActivityGalleryPreview({ activity }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [activity.id]);

  const loadPhotos = async () => {
    try {
      const result = await photoAPI.getActivityPhotos(activity.id, { limit: 4 });
      setPhotos(result.data.photos || []);
    } catch (error) {
      console.error('Failed to load photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdate = (photoId, isLiked) => {
    setPhotos(prev =>
      prev.map(p =>
        p.id === photoId
          ? { ...p, is_liked: isLiked, likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      )
    );
  };

  // Don't render if still loading or no photos
  if (loading) return null;
  if (photos.length === 0) return null;

  const isArchived = activity.status === 'completed';

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <Link
        to={`/gallery/${activity.id}`}
        className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {activity.cover_image_url ? (
            <img
              src={activity.cover_image_url}
              alt={activity.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              {isArchived && (
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  Archived
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{photos.length} photos</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>

      {/* Photo Preview */}
      <div className="px-4 pb-4">
        <PhotoGrid
          photos={photos.slice(0, 4)}
          onPhotoUpdate={handlePhotoUpdate}
        />
      </div>
    </div>
  );
}
