import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Card, EmptyState } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import type { Branch } from '../../types';
import { Building2 } from 'lucide-react';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token, isLoading: authLoading } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    const fetchBranches = async () => {
      try {
        const data = await api.getUserBranches();
        setBranches(data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBranches();
  }, [token, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {t('home.title')}
      </h1>
      {branches.length === 0 ? (
        <EmptyState icon={<Building2 className="w-8 h-8" />} title={t('home.noBranches')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <Card
              key={branch.id}
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate(`/branches/${branch.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {branch.name}
                  </h3>
                  {branch.address && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {branch.address}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
