import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/common';
import { api } from '../../api';
import { Store, Building2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stats {
  stores: number;
  branches: number;
  users: number;
}

const statIcons = {
  stores: Store,
  branches: Building2,
  users: Users,
};

const statColors = {
  stores: { bg: 'from-blue-500/10 to-blue-600/20', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  branches: { bg: 'from-green-500/10 to-green-600/20', icon: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
  users: { bg: 'from-purple-500/10 to-purple-600/20', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
};

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ stores: 0, branches: 0, users: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [stores, branches, users] = await Promise.all([
          api.getStores(),
          api.getBranches(),
          api.getUsers(),
        ]);
        setStats({
          stores: stores.length,
          branches: branches.length,
          users: users.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: t('dashboard.totalStores'), value: stats.stores, key: 'stores' as const },
    { label: t('dashboard.totalBranches'), value: stats.branches, key: 'branches' as const },
    { label: t('dashboard.totalUsers'), value: stats.users, key: 'users' as const },
  ];

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
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-gradient-to-br ${colors.bg} border ${colors.border} hover:shadow-xl transition-all duration-300`}>
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
