import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { activityAPI } from '../utils/api';
import {
  ArrowLeft, Trophy, Medal, Award, Loader2
} from 'lucide-react';
import { getInitials, getAvatarColor } from '../utils/helpers';

export function Leaderboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overall');

  useEffect(() => {
    loadLeaderboard();
  }, [id, activeTab]);

  const loadLeaderboard = async () => {
    try {
      const result = await activityAPI.getLeaderboard(id, activeTab);
      setLeaderboard(result.data.rankings || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Medal className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 text-center font-bold text-gray-400">{rank}</span>;
    }
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-100';
    }
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
          <h1 className="font-semibold text-gray-900">Leaderboard</h1>
        </div>
      </div>

      <div className="page-container">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overall', 'weekly', 'daily'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8 py-4">
            {/* 2nd Place */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 mx-auto mb-2 overflow-hidden border-4 border-gray-300">
                {leaderboard[1]?.avatar_url ? (
                  <img
                    src={leaderboard[1].avatar_url}
                    alt={leaderboard[1].nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${getAvatarColor(leaderboard[1]?.nickname)} text-white flex items-center justify-center text-lg font-bold`}>
                    {getInitials(leaderboard[1]?.nickname)}
                  </div>
                )}
              </div>
              <div className="w-20 h-24 bg-gray-200 rounded-t-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">2</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 truncate w-20">
                {leaderboard[1]?.nickname}
              </p>
              <p className="text-xs text-gray-500">{leaderboard[1]?.total_points} pts</p>
            </div>

            {/* 1st Place */}
            <div className="text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-1" />
              <div className="w-20 h-20 rounded-full bg-yellow-100 mx-auto mb-2 overflow-hidden border-4 border-yellow-400">
                {leaderboard[0]?.avatar_url ? (
                  <img
                    src={leaderboard[0].avatar_url}
                    alt={leaderboard[0].nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${getAvatarColor(leaderboard[0]?.nickname)} text-white flex items-center justify-center text-xl font-bold`}>
                    {getInitials(leaderboard[0]?.nickname)}
                  </div>
                )}
              </div>
              <div className="w-24 h-32 bg-yellow-100 rounded-t-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-yellow-600">1</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 truncate w-24">
                {leaderboard[0]?.nickname}
              </p>
              <p className="text-xs text-gray-500">{leaderboard[0]?.total_points} pts</p>
            </div>

            {/* 3rd Place */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 mx-auto mb-2 overflow-hidden border-4 border-amber-400">
                {leaderboard[2]?.avatar_url ? (
                  <img
                    src={leaderboard[2].avatar_url}
                    alt={leaderboard[2].nickname}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${getAvatarColor(leaderboard[2]?.nickname)} text-white flex items-center justify-center text-lg font-bold`}>
                    {getInitials(leaderboard[2]?.nickname)}
                  </div>
                )}
              </div>
              <div className="w-20 h-16 bg-amber-100 rounded-t-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-amber-600">3</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 truncate w-20">
                {leaderboard[2]?.nickname}
              </p>
              <p className="text-xs text-gray-500">{leaderboard[2]?.total_points} pts</p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.slice(3).map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${getRankStyle(entry.rank || index + 4)}`}
              >
                {getRankIcon(entry.rank || index + 4)}

                {entry.avatar_url ? (
                  <img
                    src={entry.avatar_url}
                    alt={entry.nickname}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full ${getAvatarColor(entry.nickname)} text-white flex items-center justify-center font-medium`}>
                    {getInitials(entry.nickname)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {entry.nickname}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.total_checkins} check-ins
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-primary">{entry.total_points}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rankings yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Be the first to join and check in!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
