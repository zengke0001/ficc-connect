import { Link } from 'react-router-dom';
import { Calendar, Users, Flame, ChevronRight } from 'lucide-react';
import { formatDateRange, daysRemaining, getStreakFlame } from '../utils/helpers';

export function ActivityCard({ activity, showStreak = false, streak = 0 }) {
  const daysLeft = daysRemaining(activity.end_date);
  const isArchived = activity.status === 'completed';

  return (
    <Link
      to={`/activities/${activity.id}`}
      className="card overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Cover Image */}
      <div className="relative h-32 bg-gray-200">
        {activity.cover_image_url ? (
          <img
            src={activity.cover_image_url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
            <Flame className="w-12 h-12 text-primary/50" />
          </div>
        )}
        {isArchived && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold">Completed</span>
          </div>
        )}
        {showStreak && streak > 0 && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <span>{getStreakFlame(streak)}</span>
            <span>{streak} days</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{activity.title}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {activity.description || 'No description'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>{formatDateRange(activity.start_date, activity.end_date)}</span>
          </div>
          {activity.participant_count !== undefined && (
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{activity.participant_count} joined</span>
            </div>
          )}
        </div>

        {/* Days Left Badge */}
        {!isArchived && daysLeft > 0 && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {daysLeft} days left
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
