import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ActivityCard } from '../components/ActivityCard';
import { activityAPI } from '../utils/api';
import { Flame, Plus, Archive, ChevronRight } from 'lucide-react';

export function Home() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadActivities(true);
  }, []);

  const loadActivities = async (reset = false) => {
    const currentPage = reset ? 1 : page;

    try {
      const result = await activityAPI.list({
        status: 'active',
        page: currentPage,
        limit: 10
      });

      const newActivities = (result.data.activities || []).map(a => ({
        ...a,
        id: a.activity_id
      }));

      if (reset) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }

      setHasMore(newActivities.length === 10);
      if (!reset) {
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
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
            <p className="text-sm text-gray-500">Discover activities around you!</p>
          </div>
        </div>
      </div>

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

      {/* Activities */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Activities</h2>
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
            {activities.slice(0, 5).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                showStreak={true}
                streak={activity.current_streak}
              />
            ))}
            {hasMore && (
              <Link
                to="/activities"
                className="block w-full py-3 text-center text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
              >
                View all activities
              </Link>
            )}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Flame className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No active activities</h3>
            <p className="text-sm text-gray-500 mb-4">
              Be the first to create an activity!
            </p>
            <Link to="/activities/new" className="btn btn-primary">
              Create Activity
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
