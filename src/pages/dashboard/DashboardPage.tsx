import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Skeleton, SkeletonCard } from '../../components/common';
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
    {
      label: t('dashboard.totalBranches'),
      value: stats.branches,
      key: 'branches' as const,
      show: canViewBranches,
      icon: Building2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      linkTo: '/branches',
    },
    {
      label: t('dashboard.totalUsers'),
      value: stats.users,
      key: 'users' as const,
      show: canViewUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      linkTo: '/users',
    },
  ].filter(s => s.show);

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="text" width={160} height={24} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
            >
              <Link to={stat.linkTo}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                      <motion.p
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                        className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5"
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

export default DashboardPage;
