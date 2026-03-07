import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Button, Card } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import type { Store } from '../../types';
import { Store as StoreIcon } from 'lucide-react';

export function StoreSelectPage() {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await api.getStores();
        setStores(data);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleSelectStore = async () => {
    if (!selectedStore) return;
    setIsSaving(true);
    try {
      const updatedUser = await api.setUserStore(selectedStore);
      updateUser(updatedUser);
      navigate('/home');
    } catch (error) {
      console.error('Error setting store:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <StoreIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('stores.select')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('stores.selectDescription')}
          </p>
        </div>
        <div className="space-y-3">
          {stores.map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.id)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                selectedStore === store.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">{store.name}</div>
              {store.address && (
                <div className="text-sm text-gray-500 dark:text-gray-400">{store.address}</div>
              )}
            </button>
          ))}
        </div>
        <Button
          onClick={handleSelectStore}
          disabled={!selectedStore || isSaving}
          className="w-full mt-6"
        >
          {isSaving ? t('common.loading') : t('common.continue')}
        </Button>
      </Card>
    </div>
  );
}
