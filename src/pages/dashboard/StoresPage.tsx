import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { api } from '../../api';
import type { Store } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

export function StoresPage() {
  const { t } = useTranslation();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState({ name: '' });

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

  useEffect(() => {
    fetchStores();
  }, []);

  const handleOpenModal = (store?: Store) => {
    setErrors({});
    if (store) {
      setEditingStore(store);
      setFormData({ name: store.name });
    } else {
      setEditingStore(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData, [
      { field: 'name', rules: { required: validationMessages.nameRequired } },
    ]);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (editingStore) {
        await api.updateStore(editingStore.id, formData);
      } else {
        await api.createStore(formData);
      }
      setIsModalOpen(false);
      fetchStores();
    } catch (error) {
      const message = api.getErrorMessage(error);
      alert(message);
      console.error('Error saving store:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('stores.confirmDelete'))) {
      try {
        await api.deleteStore(id);
        fetchStores();
      } catch (error) {
        const message = api.getErrorMessage(error);
        alert(message);
        console.error('Error deleting store:', error);
      }
    }
  };

  const columns = [
    { key: 'name', header: t('stores.name') },
    { key: 'manager_name', header: t('stores.manager'), render: (s: Store) => s.manager_name || '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (store: Store) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(store)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(store.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('stores.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('stores.create')}
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table data={stores} columns={columns} keyExtractor={(s) => s.id} emptyMessage={t('stores.noStores')} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStore ? t('stores.edit') : t('stores.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('stores.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
        </div>
      </Modal>
    </div>
  );
}
