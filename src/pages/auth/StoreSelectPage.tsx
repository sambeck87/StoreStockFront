import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Button, Card, Input } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import type { Store } from '../../types';
import { Store as StoreIcon, Plus, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function StoreSelectPage() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

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
    if (!selectedStore || !user) return;
    setIsSaving(true);
    setError('');
    try {
      const updatedUser = await api.updateUser(user.id, { store_id: selectedStore } as any);
      updateUser(updatedUser);
      navigate('/inventory');
    } catch (err) {
      console.error('Error setting store:', err);
      setError(t('stores.selectError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateStore = async () => {
    if (!newStoreName.trim() || !user) return;
    setIsCreating(true);
    setError('');
    try {
      const newStore = await api.createStore({ name: newStoreName.trim() });
      const updatedUser = await api.updateUser(user.id, { store_id: newStore.id } as any);
      updateUser(updatedUser);
      navigate('/inventory');
    } catch (err) {
      console.error('Error creating store:', err);
      setError(t('stores.createError'));
    } finally {
      setIsCreating(false);
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

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3 max-h-64 overflow-y-auto">
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
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('common.continue')
          )}
        </Button>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="secondary"
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('stores.createNew')}
          </Button>
        </div>
      </Card>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('stores.createNew')}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <Input
                label={t('stores.name')}
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder={t('stores.namePlaceholder')}
                required
              />

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateStore}
                  disabled={!newStoreName.trim() || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t('stores.create')
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
