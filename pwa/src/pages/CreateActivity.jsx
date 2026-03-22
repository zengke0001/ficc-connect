import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityAPI, photoAPI } from '../utils/api';
import {
  ArrowLeft, Calendar, Image as ImageIcon, Loader2, X
} from 'lucide-react';

export function CreateActivity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [coverPreview, setCoverPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    cover_image: null
  });

  const handleCoverSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      e.target.value = '';
      return;
    }

    setFormData({ ...formData, cover_image: file });
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setFormData({ ...formData, cover_image: null });
    if (coverPreview) {
      URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert('Please select start and end dates');
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      let cover_image_url = null;

      // Upload cover image if selected
      if (formData.cover_image) {
        try {
          const uploadResult = await photoAPI.uploadGeneral(formData.cover_image);
          cover_image_url = uploadResult.data.photo.url;
        } catch (uploadError) {
          console.error('Failed to upload cover image:', uploadError);
          alert('Failed to upload cover image. Creating activity without cover.');
        }
      }

      const data = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        cover_image_url
      };

      const result = await activityAPI.create(data);
      alert('Activity created successfully!');
      navigate(`/activities/${result.data.activity.id}`);
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

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
          <h1 className="font-semibold text-gray-900">Create Activity</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="page-container">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Image */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Cover Image (Optional)</h3>
            {coverPreview ? (
              <div className="relative">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full aspect-video object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <span className="text-gray-500">Tap to add cover image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleCoverSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="card p-4">
            <label className="block font-semibold text-gray-900 mb-2">
              Activity Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              placeholder="e.g., Morning Run Challenge"
              maxLength={100}
              required
            />
          </div>

          {/* Description */}
          <div className="card p-4">
            <label className="block font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[120px] resize-none"
              placeholder="Describe the activity, rules, goals..."
              maxLength={500}
            />
            <p className="text-right text-xs text-gray-400 mt-1">
              {formData.description.length}/500
            </p>
          </div>

          {/* Dates */}
          <div className="card p-4">
            <label className="block font-semibold text-gray-900 mb-3">
              Duration *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input pl-10"
                    min={today}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input pl-10"
                    min={formData.start_date || today}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-4 text-lg font-semibold disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                Creating...
              </>
            ) : (
              'Create Activity'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
