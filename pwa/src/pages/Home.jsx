import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActivityCard } from '../components/ActivityCard';
import { activityAPI } from '../utils/api';
import { Flame, Plus, Archive, ChevronRight, Trophy } from 'lucide-react';
import { getStreakFlame } from '../utils/helpers';

export function Home() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    loadTodayStatus();
  }, []);

  const loadTodayStatus = async () => {
    try {
      const result = await activityAPI.getTodayStatus();
      const acts = result.data.activities || [];
      setActivities(acts);

      const max = acts.reduce((m, a) => Math.max(m, a.current_streak || 0), 0);
      setMaxStreak(max);
    } catch (error) {
      console.error('Failed to load today status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.nickname}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-medium">
              {user?.nickname?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hello, {user?.nickname || 'Guest'}</h1>
            <p className="text-sm text-gray-500">Keep the streak alive!</p>
          </div>
        </div>
      </div>

      {/* Streak Card */}
      {maxStreak > 0 && (
        <div className="card p-4 mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-100">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{getStreakFlame(maxStreak)}</div>
            <div>
              <p className="text-sm text-gray-600">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{maxStreak} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link
          to="/activities/new"
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <span className="font-medium text-gray-900">Create Activity</span>
        </Link>

        <Link
          to="/activities?status=archived"
          className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Archive className="w-5 h-5 text-gray-600" />
          </div>
          <span className="font-medium text-gray-900">Archived</span>
        </Link>
      </div>

      {/* My Activities */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">My Activities</h2>
          <Link
            to="/activities"
            className="text-sm text-primary font-medium flex items-center gap-1"
          >
            View all
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="card h-32 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <ActivityCard
                key={activity.activity_id}
                activity={activity}
                showStreak={true}
                streak={activity.current_streak}
              />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No active activities</h3>
            <p className="text-sm text-gray-500 mb-4">
              Join or create an activity to get started
            </p>
            <Link to="/activities" className="btn btn-primary">
              Discover Activities
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="font-medium text-gray-900">
                {activities.reduce((sum, a) => sum + (a.total_checkins || 0), 0)} check-ins
              </p>
            </div>
          </div>
          <Link
            to="/leaderboard"
            className="text-sm text-primary font-medium"
          >
            View Rankings
          </Link>
        </div>
      </div>
    </div>
  );
}
