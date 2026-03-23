import { useEffect, useCallback } from 'react';
import { X, Heart, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { formatRelativeTime } from '../utils/helpers';
import { photoAPI } from '../utils/api';
import { useState } from 'react';

export function PhotoViewer({ photos, currentIndex, isOpen, onClose, onPhotoUpdate }) {
  const [liking, setLiking] = useState(false);
  const [currentPhoto, setCurrentPhoto] = useState(null);

  useEffect(() => {
    if (isOpen && photos[currentIndex]) {
      setCurrentPhoto(photos[currentIndex]);
    }
  }, [isOpen, photos, currentIndex]);

  const handlePrev = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentPhoto(photos[currentIndex - 1]);
      onPhotoUpdate?.(currentIndex - 1);
    }
  }, [currentIndex, photos, onPhotoUpdate]);

  const handleNext = useCallback((e) => {
    e?.stopPropagation();
    if (currentIndex < photos.length - 1) {
      setCurrentPhoto(photos[currentIndex + 1]);
      onPhotoUpdate?.(currentIndex + 1);
    }
  }, [currentIndex, photos, onPhotoUpdate]);

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
      // Update local state
      const updatedPhoto = {
        ...currentPhoto,
        is_liked: !currentPhoto.is_liked,
        likes_count: currentPhoto.is_liked
          ? currentPhoto.likes_count - 1
          : currentPhoto.likes_count + 1
      };
      setCurrentPhoto(updatedPhoto);
      // Notify parent
      onPhotoUpdate?.(currentPhoto.id, !currentPhoto.is_liked);
    } catch (error) {
      console.error('Failed to like photo:', error);
    } finally {
      setLiking(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when viewer is open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentPhoto) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < photos.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          {currentPhoto.user_avatar ? (
            <img
              src={currentPhoto.user_avatar}
              alt={currentPhoto.user_nickname}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
              <User size={20} className="text-gray-300" />
            </div>
          )}
          <div>
            <p className="text-white font-medium">{currentPhoto.user_nickname}</p>
            <p className="text-white/60 text-sm">
              {formatRelativeTime(currentPhoto.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Like button */}
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

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Image */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Previous button */}
        {hasPrev && (
          <button
            onClick={handlePrev}
            className="absolute left-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronLeft size={32} />
          </button>
        )}

        {/* Image */}
        <img
          src={currentPhoto.url}
          alt="Full size"
          className="max-w-full max-h-full object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Next button */}
        {hasNext && (
          <button
            onClick={handleNext}
            className="absolute right-4 p-3 text-white hover:bg-white/20 rounded-full transition-colors z-10"
          >
            <ChevronRight size={32} />
          </button>
        )}
      </div>

      {/* Footer - Photo counter */}
      <div className="p-4 bg-gradient-to-t from-black/80 to-transparent text-center">
        <p className="text-white/80 text-sm">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </div>
  );
}
