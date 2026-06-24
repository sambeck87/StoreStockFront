import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common';
import { api } from '../../api';
import { Building2, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  branches: number;
  users: number;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const { permissionResources } = useAuth();
  const [stats, setStats] = useState<Stats>({ branches: 0, users: 0 });
  const [isLoading, setIsLoading] = useState(true);

  console.log('Dashboard - permissionResources:', permissionResources);

  const canViewUsers = (permissionResources['user']?.length ?? 0) > 0;
  const canViewBranches = (permissionResources['branch']?.length ?? 0) > 0;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const promises = [];
        if (canViewBranches) promises.push(api.getBranches());
        if (canViewUsers) promises.push(api.getUsers());
        
        const results = await Promise.all(promises);
        let idx = 0;
        setStats({
          branches: canViewBranches ? results[idx++].length : 0,
          users: canViewUsers ? results[idx++].length : 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [canViewUsers, canViewBranches]);

  const statCards = [
    { label: t('dashboard.totalBranches'), value: stats.branches, key: 'branches' as const, show: canViewBranches },
    { label: t('dashboard.totalUsers'), value: stats.users, key: 'users' as const, show: canViewUsers },
  ].filter(s => s.show);

  const statIcons = {
    branches: Building2,
    users: Users,
  };

  const statColors = {
    branches: { bg: 'from-green-500/10 to-green-600/20', icon: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    users: { bg: 'from-purple-500/10 to-purple-600/20', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-8"
      >
        {t('dashboard.title')}
      </motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = statIcons[stat.key];
          const colors = statColors[stat.key];
          const linkTo = stat.key === 'branches' ? '/branches' : '/users';
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={linkTo}>
                <Card className={`bg-gradient-to-br ${colors.bg} border ${colors.border} hover:shadow-xl transition-all duration-300 cursor-pointer`}>
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-4 rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-lg`}
                    >
                      <Icon className={`w-7 h-7 ${colors.icon}`} />
                    </motion.div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 200 }}
                        className="text-3xl font-bold text-gray-900 dark:text-white"
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
