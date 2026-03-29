import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ActivityCard } from '../components/ActivityCard';
import { activityAPI } from '../utils/api';
import { Plus, Search, Loader2 } from 'lucide-react';

export function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const tab = searchParams.get('status') === 'archived' ? 'archived' : 
    searchParams.get('status') === 'my' ? 'my' : 'active';

  useEffect(() => {
    setPage(1);
    loadActivities(true);
  }, [tab]);

  const loadActivities = async (reset = false) => {
    const currentPage = reset ? 1 : page;

    try {
      const params = {
        page: currentPage,
        limit: 10
      };

      if (tab === 'my') {
        params.created_by = 'me';
        params.status = 'active';
      } else if (tab === 'archived') {
        params.status = 'completed';
      } else {
        params.status = 'active';
      }

      const result = await activityAPI.list(params);

      const newActivities = result.data.activities || [];

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

  const switchTab = (newTab) => {
    if (newTab === tab) return;
    if (newTab === 'my') {
      setSearchParams({ status: 'my' });
    } else if (newTab === 'archived') {
      setSearchParams({ status: 'archived' });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
        <Link
          to="/activities/new"
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Create</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => switchTab('my')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            tab === 'my'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          My
        </button>
        <button
          onClick={() => switchTab('active')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            tab === 'active'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => switchTab('archived')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
            tab === 'archived'
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : activities.length > 0 ? (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {hasMore && (
            <button
              onClick={() => loadActivities(false)}
              className="w-full py-3 text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors"
            >
              Load more
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-1">
            No {tab === 'my' ? 'my activities' : tab === 'active' ? 'active activities' : 'archived activities'}
          </h3>
          <p className="text-sm text-gray-500">
            {tab === 'my'
              ? 'Create a new activity to get started'
              : tab === 'active'
              ? 'No activities available'
              : 'Completed activities will appear here'}
          </p>
          {(tab === 'my' || tab === 'active') && (
            <Link
              to="/activities/new"
              className="btn btn-primary mt-4 inline-block"
            >
              Create Activity
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
