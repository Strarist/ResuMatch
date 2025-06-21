import React from 'react';
import { PageTransition } from '../../components/common/PageTransition';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { useAuthStore } from '../../store/auth';

const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <PageTransition>
      <div className="w-full max-w-xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">My Profile</h1>
        <Card className="p-8 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-5xl text-white select-none">
              {user?.name ? user.name[0].toUpperCase() : user?.email?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user?.name || 'User'}</h2>
            <p className="text-gray-500 dark:text-gray-300">{user?.email}</p>
            {/* <p className="text-gray-400 text-sm mt-1">Joined: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</p> */}
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
            <button className="btn-primary w-full sm:w-auto">Edit Profile</button>
            <button className="btn-secondary w-full sm:w-auto">Change Password</button>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Profile; 