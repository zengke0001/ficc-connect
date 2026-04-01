import { useState } from 'react';
import { Heart, User } from 'lucide-react';
import { formatRelativeTime, truncate } from '../utils/helpers';
import { photoAPI } from '../utils/api';
import { PhotoViewer } from './PhotoViewer';

export function PhotoGrid({ photos, onPhotoUpdate }) {
  const [liking, setLiking] = useState({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLike = async (photo, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (liking[photo.id]) return;

    setLiking(prev => ({ ...prev, [photo.id]: true }));

    try {
      if (photo.is_liked) {
        await photoAPI.unlike(photo.id);
      } else {
        await photoAPI.like(photo.id);
      }
      onPhotoUpdate?.(photo.id, !photo.is_liked);
    } catch (error) {
      console.error('Failed to like photo:', error);
    } finally {
      setLiking(prev => ({ ...prev, [photo.id]: false }));
    }
  };

  const openViewer = (index) => {
    setCurrentIndex(index);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    setViewerOpen(false);
  };

  const handleViewerPhotoUpdate = (photoId, isLiked) => {
    onPhotoUpdate?.(photoId, isLiked);
  };

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No photos yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group cursor-pointer"
            onClick={() => openViewer(index)}
          >
          <img
            src={photo.url}
            alt="Activity photo"
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            {/* User Info */}
            <div className="absolute bottom-2 left-2 right-2">
              <div className="flex items-center gap-2">
                {photo.avatar_url ? (
                  <img
                    src={photo.avatar_url}
                    alt={photo.nickname || 'User'}
                    className="w-6 h-6 rounded-full object-cover border border-white/50"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <User size={12} className="text-gray-600" />
                  </div>
                )}
                <span className="text-white text-xs font-medium truncate">
                  {photo.nickname || 'Anonymous'}
                </span>
              </div>
              <p className="text-white/70 text-xs mt-1">
                {photo.created_at ? formatRelativeTime(photo.created_at) : ''}
              </p>
            </div>

            {/* Like Button */}
            <button
              onClick={(e) => handleLike(photo, e)}
              disabled={liking[photo.id]}
              className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                photo.is_liked
                  ? 'bg-red-500 text-white'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
            >
              <Heart
                size={16}
                fill={photo.is_liked ? 'currentColor' : 'none'}
              />
            </button>
          </div>

          {/* Like Count */}
          {photo.likes_count > 0 && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/30 text-white px-2 py-1 rounded-full text-xs">
              <Heart size={12} fill="currentColor" />
              <span>{photo.likes_count}</span>
            </div>
          )}
        </div>
      ))}
    </div>

    {/* Full Screen Viewer */}
    <PhotoViewer
      photos={photos}
      currentIndex={currentIndex}
      isOpen={viewerOpen}
      onClose={closeViewer}
      onPhotoUpdate={handleViewerPhotoUpdate}
    />
  </>
  );
}
