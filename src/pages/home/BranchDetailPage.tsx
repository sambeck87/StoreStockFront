import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Card, EmptyState } from '../../components/common';
import type { Category } from '../../types';
import { ArrowLeft, Tag } from 'lucide-react';
import { Skeleton } from '../../components/common';

export function BranchDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!id) return;
      try {
        const data = await api.getBranchCategories(Number(id));
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally { setIsLoading(false); }
    };
    fetchCategories();
  }, [id]);

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="text" width={120} height={20} className="mb-4" />
        <Skeleton variant="text" width={180} height={24} className="mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-5">
              <Skeleton variant="text" width="60%" height={16} className="mb-2" />
              <Skeleton variant="text" width="40%" height={12} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('common.back')}
      </button>
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('categories.title')}</h1>
      {categories.length === 0 ? (
        <EmptyState icon={<Tag className="w-8 h-8" />} title={t('categories.noCategories')} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="cursor-pointer hover:shadow-md transition-all duration-200 group"
              onClick={() => navigate(`/categories/${category.id}`)}>
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 group-hover:scale-110 transition-transform duration-200">
                  <Tag className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                  {category.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default BranchDetailPage;
