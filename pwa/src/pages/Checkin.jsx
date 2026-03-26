import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { activityAPI } from '../utils/api';
import { photoAPI } from '../utils/api';
import {
  ArrowLeft, Home, Camera, X, CheckCircle, Loader2,
  Flame, Image as ImageIcon, Edit2, Archive
} from 'lucide-react';
import { formatDateRange, getStreakFlame } from '../utils/helpers';
import { useAuth } from '../contexts/AuthContext';

export function Checkin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [activity, setActivity] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      const result = await activityAPI.getOne(id);
      setActivity(result.data.activity);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Image size should be less than 20MB');
      e.target.value = '';
      return;
    }

    setCompressing(true);
    try {
      // Compress image: max 1MB, 1920px max dimension, 80% quality
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/jpeg'
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
      
      setPhoto(compressedFile);
      setPreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error('Failed to compress image:', error);
      // If compression fails, use original file
      setPhoto(file);
      setPreviewUrl(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    try {
      // First, submit checkin
      const checkinResult = await activityAPI.checkin(id, {
        comment: comment.trim() || undefined
      });

      // If already checked in today, show message and navigate
      if (checkinResult.data.already_checked_in) {
        alert('Already checked in today! ✓');
        navigate(`/activities/${id}`);
        return;
      }

      // If photo selected, upload it
      if (photo && checkinResult.data.checkin) {
        await photoAPI.upload(
          photo,
          id,
          checkinResult.data.checkin.id
        );
      }

      // Show success and navigate back
      alert('Check-in successful! 🎉');
      navigate(`/activities/${id}`);
    } catch (error) {
      console.error('Failed to check in:', error);
      alert('Failed to check in: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this activity? It will be marked as completed.')) return;
    try {
      await activityAPI.archive(id);
      alert('Activity archived successfully');
      navigate('/');
    } catch (error) {
      console.error('Failed to archive:', error);
      alert(error.message || 'Failed to archive activity');
    }
  };

  const handleEdit = () => {
    navigate(`/activities/${id}?edit=true`);
  };

  const isCreator = user && activity && user.id === activity.creator_id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Cover Image with Action Buttons */}
      <div className="relative h-48">
        {activity?.cover_image_url ? (
          <img
            src={activity.cover_image_url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/40 to-primary/60 flex items-center justify-center">
            <Flame className="w-20 h-20 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Creator Actions */}
          {isCreator && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleEdit}
                className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleArchive}
                className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
              >
                <Archive className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {/* Activity Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white">{activity?.title}</h1>
          <p className="text-sm text-white/80">
            {activity && formatDateRange(activity.start_date, activity.end_date)}
          </p>
        </div>
      </div>

      <div className="page-container">
        {/* Photo Upload */}
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Add Photo (Optional)</h3>

          {compressing ? (
            <div className="w-full aspect-square border-2 border-dashed border-primary bg-primary/5 rounded-lg flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-primary font-medium">Compressing...</span>
            </div>
          ) : previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Camera className="w-8 h-8 text-gray-400" />
              <span className="text-gray-500">Tap to add photo</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handlePhotoSelect}
            className="hidden"
          />
        </div>

        {/* Comment */}
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">How are you feeling?</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts (optional)..."
            className="input min-h-[100px] resize-none"
            maxLength={200}
          />
          <p className="text-right text-xs text-gray-400 mt-1">
            {comment.length}/200
          </p>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-3">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <Home className="w-5 h-5" />
            Home
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 btn btn-primary py-4 text-lg font-semibold disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Checking in...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 inline mr-2" />
                Check In
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
