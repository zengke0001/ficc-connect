import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityAPI } from '../utils/api';
import { photoAPI } from '../utils/api';
import {
  ArrowLeft, Camera, X, CheckCircle, Loader2,
  Flame, Image as ImageIcon
} from 'lucide-react';
import { formatDateRange, getStreakFlame } from '../utils/helpers';

export function Checkin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activity, setActivity] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      e.target.value = '';
      return;
    }

    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900">Check In</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="page-container">
        {/* Activity Info */}
        {activity && (
          <div className="card p-4 mb-6">
            <div className="flex items-center gap-4">
              {activity.cover_image_url ? (
                <img
                  src={activity.cover_image_url}
                  alt={activity.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="font-semibold text-gray-900">{activity.title}</h2>
                <p className="text-sm text-gray-500">
                  {formatDateRange(activity.start_date, activity.end_date)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Photo Upload */}
        <div className="card p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Add Photo (Optional)</h3>

          {previewUrl ? (
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

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full btn btn-primary py-4 text-lg font-semibold disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Checking in...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 inline mr-2" />
              Check In Now
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          Keep your streak going! 🔥
        </p>
      </div>
    </div>
  );
}
