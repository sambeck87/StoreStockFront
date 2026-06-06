import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Card } from '../../components/common';
import type { Category } from '../../types';
import { ArrowLeft, Tag } from 'lucide-react';

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
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {t('categories.title')}
      </h1>
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('categories.noCategories')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card
              key={category.id}
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate(`/categories/${category.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Tag className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {category.description}
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
