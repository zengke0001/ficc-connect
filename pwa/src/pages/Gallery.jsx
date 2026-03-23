import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PhotoGrid } from '../components/PhotoGrid';
import { activityAPI } from '../utils/api';
import { photoAPI } from '../utils/api';
import { ImageIcon, ChevronRight, Loader2 } from 'lucide-react';

export function Gallery() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      // Load all activities with photos (not just completed ones)
      const result = await activityAPI.list({ limit: 50 });
      // Filter to only show activities that have photos
      const activitiesWithPhotos = result.data.activities || [];
      setActivities(activitiesWithPhotos);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
        <p className="text-gray-500 mt-1">Photos from all activities</p>
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
          <h3 className="font-medium text-gray-900 mb-1">No galleries yet</h3>
          <p className="text-sm text-gray-500">
            Activities with photos will appear here
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

  if (loading || photos.length === 0) return null;

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
            <h3 className="font-semibold text-gray-900">{activity.title}</h3>
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
