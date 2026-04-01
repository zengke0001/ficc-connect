import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { activityAPI, photoAPI } from '../utils/api';
import { PhotoGrid } from '../components/PhotoGrid';
import { PhotoViewer } from '../components/PhotoViewer';
import {
  ArrowLeft, Calendar, Users, Trophy, Flame,
  CheckCircle, LogOut, Camera, Loader2, Image as ImageIcon,
  Archive, RotateCcw, Edit2, X, Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { formatDateRange, daysRemaining, getInitials, getAvatarColor } from '../utils/helpers';

export function ActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', cover_image_url: '', allow_multiple_checkins: false });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  useEffect(() => {
    loadActivity();
  }, [id]);

  const loadActivity = async () => {
    try {
      const result = await activityAPI.getOne(id);
      setActivity(result.data.activity);
      setParticipants(result.data.participants || []);
      setLeaderboard(result.data.leaderboard || []);
      setRecentPhotos(result.data.recentPhotos || []);
      // Backend returns isJoined (camelCase), not is_joined
      setIsJoined(result.data.isJoined ?? result.data.is_joined ?? false);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await activityAPI.join(id);
      setIsJoined(true);
      loadActivity();
    } catch (error) {
      console.error('Failed to join:', error);
      alert(error.message || 'Failed to join activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this activity?')) return;

    setActionLoading(true);
    try {
      await activityAPI.leave(id);
      setIsJoined(false);
      loadActivity();
    } catch (error) {
      console.error('Failed to leave:', error);
      alert('Failed to leave activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckin = () => {
    navigate(`/checkin/${id}`);
  };

  const openPhotoViewer = (index) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const closePhotoViewer = () => {
    setViewerOpen(false);
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this activity? It will be marked as completed.')) return;

    setActionLoading(true);
    try {
      await activityAPI.archive(id);
      loadActivity();
      alert('Activity archived successfully');
    } catch (error) {
      console.error('Failed to archive:', error);
      alert(error.message || 'Failed to archive activity');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore this activity? It will become active again.')) return;

    setActionLoading(true);
    try {
      await activityAPI.restore(id);
      loadActivity();
      alert('Activity restored successfully');
    } catch (error) {
      console.error('Failed to restore:', error);
      alert(error.message || 'Failed to restore activity');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if current user is the activity creator
  const isCreator = user && activity && user.id === activity.creator_id;

  const openEditModal = () => {
    setEditForm({
      title: activity.title,
      description: activity.description || '',
      cover_image_url: activity.cover_image_url || '',
      allow_multiple_checkins: activity.allow_multiple_checkins === 1 || activity.allow_multiple_checkins === true
    });
    setCoverFile(null);
    setCoverPreview(activity.cover_image_url || null);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setCoverFile(null);
    setCoverPreview(null);
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const updates = { ...editForm };

      // Upload new cover photo if selected
      if (coverFile) {
        try {
          const uploadResult = await photoAPI.uploadGeneral(coverFile);
          updates.cover_image_url = uploadResult.data.photo.url;
        } catch (uploadError) {
          console.error('Failed to upload cover image:', uploadError);
          alert('Failed to upload cover image. Please try again.');
          setActionLoading(false);
          return;
        }
      }

      await activityAPI.update(id, updates);
      await loadActivity();
      closeEditModal();
      alert('Activity updated successfully');
    } catch (error) {
      console.error('Failed to update activity:', error);
      alert(error.message || 'Failed to update activity');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Activity not found</p>
      </div>
    );
  }

  const daysLeft = daysRemaining(activity.end_date);
  const isArchived = activity.status === 'completed';

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Cover with Header Buttons */}
      <div className="relative h-48">
        {activity.cover_image_url ? (
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
        
        {/* Top Bar with Actions */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {isCreator && (
            <div className="flex items-center gap-2">
              {isArchived ? (
                <button
                  onClick={handleRestore}
                  disabled={actionLoading}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  title="Restore Activity"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={handleArchive}
                    disabled={actionLoading}
                    className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
                    title="Archive Activity"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={openEditModal}
                    disabled={actionLoading}
                    className="p-2 bg-black/30 text-white rounded-full hover:bg-black/50"
                    title="Edit Activity"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Activity Title */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-xl font-bold text-white">{activity.title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDateRange(activity.start_date, activity.end_date)}
            </span>
            {!isArchived && daysLeft > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full">
                {daysLeft} days left
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* Description */}
        <div className="card p-4 mb-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-900">About</h3>
            {activity.allow_multiple_checkins && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                🔁 Multi Check-in
              </span>
            )}
          </div>
          <p className="text-gray-600">
            {activity.description || 'No description provided.'}
          </p>
        </div>

        {/* Recent Photos */}
        {recentPhotos.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Photos
              </h3>
              <Link
                to={`/gallery/${id}`}
                className="text-sm text-primary font-medium"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {recentPhotos.slice(0, 6).map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => openPhotoViewer(index)}
                >
                  <img
                    src={photo.url}
                    alt="Activity photo"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard Preview */}
        {leaderboard.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent" />
                Leaderboard
              </h3>
              <Link
                to={`/leaderboard/${id}`}
                className="text-sm text-primary font-medium"
              >
                View all
              </Link>
            </div>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.user_id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                >
                  <span className="w-6 text-center font-bold text-gray-400">
                    {index + 1}
                  </span>
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.nickname}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(entry.nickname)} text-white flex items-center justify-center text-xs font-medium`}>
                      {getInitials(entry.nickname)}
                    </div>
                  )}
                  <span className="flex-1 font-medium text-gray-900 truncate">
                    {entry.nickname}
                  </span>
                  <span className="font-semibold text-primary">
                    {entry.total_points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="card p-4 mb-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Participants ({participants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.slice(0, 10).map((p) => (
              <div
                key={p.user_id}
                title={p.nickname}
                className="w-10 h-10 rounded-full overflow-hidden"
              >
                {p.avatar_url ? (
                  <img
                    src={p.avatar_url}
                    alt={p.nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${getAvatarColor(p.nickname)} text-white flex items-center justify-center text-xs font-medium`}>
                    {getInitials(p.nickname)}
                  </div>
                )}
              </div>
            ))}
            {participants.length > 10 && (
              <button
                onClick={() => setParticipantsModalOpen(true)}
                className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-sm text-primary font-medium"
              >
                +{participants.length - 10}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:relative md:bg-transparent md:border-0 md:p-0">
          {!isArchived ? (
            // Active activity buttons - show check-in for both joined and creator
            isJoined || isCreator ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCheckin}
                  className="flex-1 btn btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Check In
                </button>
                {!isCreator && (
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="btn btn-outline py-3 px-4"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="w-full btn btn-primary py-3"
              >
                {actionLoading ? 'Joining...' : 'Join Activity'}
              </button>
            )
          ) : null}
        </div>
      </div>

      {/* Full Screen Photo Viewer */}
      <PhotoViewer
        photos={recentPhotos}
        currentIndex={viewerIndex}
        isOpen={viewerOpen}
        onClose={closePhotoViewer}
      />

      {/* Edit Activity Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Edit Activity</h2>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cover Image
                </label>
                {coverPreview && (
                  <div className="mb-2 relative">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        setEditForm({ ...editForm, cover_image_url: '' });
                      }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {coverFile ? coverFile.name : 'Choose new cover photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Allow Multiple Check-ins Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Allow Multiple Check-ins</h4>
                  <p className="text-sm text-gray-500">Allow checking in multiple times per day</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditForm({ ...editForm, allow_multiple_checkins: !editForm.allow_multiple_checkins })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editForm.allow_multiple_checkins ? 'bg-primary' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editForm.allow_multiple_checkins ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 btn btn-outline py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn btn-primary py-2"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* All Participants Modal */}
      {participantsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setParticipantsModalOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">All Participants ({participants.length})</h2>
              <button
                onClick={() => setParticipantsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-3">
                {participants.map((p, index) => (
                  <div key={p.user_id} className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0"
                    >
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt={p.nickname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${getAvatarColor(p.nickname)} text-white flex items-center justify-center text-xs font-medium`}>
                          {getInitials(p.nickname)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.nickname}</p>
                      {p.team_name && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: p.team_color || '#888' }}
                          />
                          {p.team_name}
                        </p>
                      )}
                    </div>
                    {p.total_checkins !== undefined && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-primary">{p.total_checkins}</p>
                        <p className="text-xs text-gray-500">check-ins</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
