import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { photoAPI } from '../utils/api';
import { PhotoGrid } from '../components/PhotoGrid';
import {
  ArrowLeft, Image as ImageIcon, Heart, Trophy, Loader2
} from 'lucide-react';

export function ActivityGallery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState([]);
  const [stats, setStats] = useState(null);
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, [id]);

  const loadGallery = async () => {
    try {
      const result = await photoAPI.getGallery(id);
      setPhotos(result.data.photos || []);
      setStats(result.data.stats || null);
      setWinners(result.data.winners || []);
    } catch (error) {
      console.error('Failed to load gallery:', error);
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Photo Gallery</h1>
        </div>
      </div>

      <div className="page-container">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-3 text-center">
              <ImageIcon className="w-6 h-6 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.total_photos}</p>
              <p className="text-xs text-gray-500">Photos</p>
            </div>
            <div className="card p-3 text-center">
              <Heart className="w-6 h-6 text-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.total_likes}</p>
              <p className="text-xs text-gray-500">Likes</p>
            </div>
            <div className="card p-3 text-center">
              <Trophy className="w-6 h-6 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.participants}</p>
              <p className="text-xs text-gray-500">Participants</p>
            </div>
          </div>
        )}

        {/* Winners */}
        {winners.length > 0 && (
          <div className="card p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Top Photos
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {winners.slice(0, 3).map((photo, index) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt="Winner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    {index === 0 && <span className="text-2xl">🥇</span>}
                    {index === 1 && <span className="text-2xl">🥈</span>}
                    {index === 2 && <span className="text-2xl">🥉</span>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <div className="flex items-center gap-1 text-white text-xs">
                      <Heart className="w-3 h-3 fill-current" />
                      <span>{photo.likes_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Photos */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">All Photos</h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : photos.length > 0 ? (
            <PhotoGrid photos={photos} onPhotoUpdate={handlePhotoUpdate} />
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No photos yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Photos will appear here when participants check in
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
