import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Button, Card, Input, Skeleton } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import type { Store } from '../../types';
import { Store as StoreIcon, Plus, Loader2 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] dark:bg-gray-950 p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center mb-8">
            <Skeleton variant="circular" width={48} height={48} className="mx-auto mb-3" />
            <Skeleton variant="text" width="60%" className="mx-auto" height={20} />
            <Skeleton variant="text" width="40%" className="mx-auto mt-2" height={14} />
          </div>
          <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] dark:border-gray-800">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1">
                  <Skeleton variant="text" width="70%" />
                  <Skeleton variant="text" width="40%" height={12} className="mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] dark:bg-gray-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <Card>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-accent)] mb-4">
              <StoreIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('stores.select')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('stores.selectDescription')}</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => setSelectedStore(store.id)}
                className={`w-full p-3 rounded-lg border text-left transition-all duration-150 ${
                  selectedStore === store.id
                    ? 'border-[var(--color-accent)] bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-[var(--color-accent)]/30'
                    : 'border-[var(--color-border)] dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{store.name}</div>
                {store.address && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{store.address}</div>
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={handleSelectStore}
            disabled={!selectedStore || isSaving}
            className="w-full"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.continue')}
          </Button>

          <div className="mt-4 pt-4 border-t border-[var(--color-border)] dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(true)}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              {t('stores.createNew')}
            </Button>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm border border-[var(--color-border)] dark:border-gray-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('stores.createNew')}</h2>
                <Input
                  label={t('stores.name')}
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder={t('stores.namePlaceholder')}
                  required
                />
              </div>
              <div className="flex gap-2 px-5 py-4 border-t border-[var(--color-border)] dark:border-gray-800">
                <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
                  {t('common.cancel')}
                </Button>
                <Button onClick={handleCreateStore} disabled={!newStoreName.trim() || isCreating} className="flex-1">
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('stores.create')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StoreSelectPage;
