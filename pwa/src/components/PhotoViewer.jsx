import { useEffect, useCallback, useState, useRef } from 'react';
import { X, Heart, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';
import { photoAPI } from '../utils/api';

export function PhotoViewer({ photos, currentIndex, isOpen, onClose, onPhotoUpdate }) {
  const [liking, setLiking] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    if (isOpen && photos[currentIndex]) {
      setCurrentPhoto(photos[currentIndex]);
    }
  }, [isOpen, photos, currentIndex]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0 && !transitioning) {
      setTransitioning(true);
      setCurrentPhoto(photos[currentIndex - 1]);
      setTimeout(() => setTransitioning(false), 300);
    }
  }, [currentIndex, photos, transitioning]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1 && !transitioning) {
      setTransitioning(true);
      setCurrentPhoto(photos[currentIndex + 1]);
      setTimeout(() => setTransitioning(false), 300);
    }
  }, [currentIndex, photos, transitioning]);

  const handleLike = async (e) => {
    e?.stopPropagation();
    if (!currentPhoto || liking) return;

    setLiking(true);
    try {
      if (currentPhoto.is_liked) {
        await photoAPI.unlike(currentPhoto.id);
      } else {
        await photoAPI.like(currentPhoto.id);
      }
      const updatedPhoto = {
        ...currentPhoto,
        is_liked: !currentPhoto.is_liked,
        likes_count: currentPhoto.is_liked
          ? currentPhoto.likes_count - 1
          : currentPhoto.likes_count + 1
      };
      setCurrentPhoto(updatedPhoto);
      onPhotoUpdate?.(currentPhoto.id, !currentPhoto.is_liked);
    } catch (error) {
      console.error('Failed to like photo:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrev();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, goToPrev, goToNext]);

  if (!isOpen || !currentPhoto) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent z-20">
        <div className="flex items-center gap-3">
          {currentPhoto.avatar_url ? (
            <img
              src={currentPhoto.avatar_url}
              alt={currentPhoto.nickname || 'User'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <User size={20} className="text-gray-300" />
            </div>
          )}
          <div>
            <p className="text-white font-medium">{currentPhoto.nickname || 'Anonymous'}</p>
            {currentPhoto.team_name && (
              <p className="text-white/60 text-sm flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentPhoto.team_color || '#888' }}
                />
                {currentPhoto.team_name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              currentPhoto.is_liked
                ? 'bg-red-500 text-white'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart
              size={20}
              fill={currentPhoto.is_liked ? 'currentColor' : 'none'}
            />
            <span>{currentPhoto.likes_count}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative">
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); goToPrev(); }}
            className="absolute left-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        <img
          src={currentPhoto.url}
          alt="Full size"
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
            transitioning ? 'scale-95 opacity-50' : 'scale-100 opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        />

        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center z-20">
        <p className="text-white/80 text-sm">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
}