import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { activityAPI } from '../utils/api';
import { PhotoGrid } from '../components/PhotoGrid';
import {
  ArrowLeft, Calendar, Users, Trophy, Flame,
  CheckCircle, LogOut, Camera, Loader2, Image as ImageIcon,
  Archive
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

  // Check if current user is the activity creator
  const isCreator = user && activity && user.id === activity.creator_id;

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
      {/* Header */}
      <div className="sticky top-0 bg-white shadow-sm z-10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-semibold text-gray-900 truncate">{activity.title}</h1>
        </div>
      </div>

      {/* Cover */}
      <div className="relative h-48 bg-gray-200">
        {activity.cover_image_url ? (
          <img
            src={activity.cover_image_url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <Flame className="w-16 h-16 text-primary/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h2 className="text-2xl font-bold">{activity.title}</h2>
          <div className="flex items-center gap-4 mt-2 text-sm">
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
          <h3 className="font-semibold text-gray-900 mb-2">About</h3>
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
              {recentPhotos.slice(0, 6).map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={photo.url}
                    alt="Activity photo"
                    className="w-full h-full object-cover"
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
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                +{participants.length - 10}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t md:relative md:bg-transparent md:border-0 md:p-0">
          {!isArchived ? (
            // Active activity buttons
            isJoined ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCheckin}
                  className="flex-1 btn btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Check In
                </button>
                <button
                  onClick={handleLeave}
                  disabled={actionLoading}
                  className="btn btn-outline py-3 px-4"
                >
                  <LogOut className="w-5 h-5" />
                </button>
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

          {/* Archive button for creator */}
          {isCreator && !isArchived && (
            <button
              onClick={handleArchive}
              disabled={actionLoading}
              className="w-full btn btn-outline py-3 mt-3 flex items-center justify-center gap-2 text-gray-600"
            >
              <Archive className="w-5 h-5" />
              {actionLoading ? 'Archiving...' : 'Archive Activity'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
