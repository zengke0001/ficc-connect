import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import {
  User, Mail, Award, Flame, Camera, LogOut,
  ChevronRight, Edit2, Trophy, Activity
} from 'lucide-react';

export function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [stats, setStats] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editNickname, setEditNickname] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await authAPI.getProfile();
      setStats(result.data.stats);
      setAchievements(result.data.achievements || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditNickname(user?.nickname || '');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editNickname.trim()) return;

    const result = await updateProfile({ nickname: editNickname.trim() });
    if (result.success) {
      setEditing(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="page-container">
      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.nickname}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-medium">
              {user?.nickname?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="input py-2"
                  placeholder="Enter nickname"
                />
                <button onClick={handleSave} className="btn btn-primary py-2">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{user?.nickname}</h1>
                <button
                  onClick={handleEdit}
                  className="p-1 text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            <p className="text-gray-500 text-sm mt-1">{user?.email || 'No email'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_checkins || 0}
              </p>
              <p className="text-sm text-gray-500">Total Check-ins</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_points || 0}
              </p>
              <p className="text-sm text-gray-500">Total Points</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.activities_joined || 0}
              </p>
              <p className="text-sm text-gray-500">Activities</p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.photos_uploaded || 0}
              </p>
              <p className="text-sm text-gray-500">Photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-accent" />
          Achievements
        </h2>

        {achievements.length > 0 ? (
          <div className="grid grid-cols-4 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="text-center"
                title={achievement.description}
              >
                <div className="text-3xl mb-1">{achievement.icon_url || '🏆'}</div>
                <p className="text-xs text-gray-600 truncate">{achievement.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-4">
            Complete activities to earn achievements
          </p>
        )}
      </div>

      {/* Menu */}
      <div className="card overflow-hidden mb-6">
        <Link
          to="/activities?status=archived"
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-medium text-gray-900">Archived Activities</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-red-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-medium">Log Out</span>
          </div>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Version */}
      <p className="text-center text-sm text-gray-400">
        FICC Connect v1.0.0
      </p>
    </div>
  );
}
