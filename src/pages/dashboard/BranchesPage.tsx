import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { api } from '../../api';
import type { Branch, Store } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

export function BranchesPage() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', storeId: '' });

  const fetchData = async () => {
    try {
      const [branchesData, storesData] = await Promise.all([
        api.getBranches(),
        api.getStores(),
      ]);
      setBranches(branchesData);
      setStores(storesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    setErrors({});
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name,
        phone: branch.phone || '',
        storeId: String(branch.store_id),
      });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', phone: '', storeId: stores[0]?.id?.toString() || '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm(formData, [
      { field: 'name', rules: { required: validationMessages.nameRequired } },
      { field: 'storeId', rules: { required: 'Selecciona una tienda' } },
    ]);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const data = { 
        name: formData.name,
        phone: formData.phone || undefined,
        storeId: Number(formData.storeId) 
      };
      if (editingBranch) {
        await api.updateBranch(editingBranch.id, data);
      } else {
        await api.createBranch(data);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      const message = api.getErrorMessage(error);
      alert(message);
      console.error('Error saving branch:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('branches.confirmDelete'))) {
      try {
        await api.deleteBranch(id);
        fetchData();
      } catch (error) {
        const message = api.getErrorMessage(error);
        alert(message);
        console.error('Error deleting branch:', error);
      }
    }
  };

  const getStoreName = (storeId?: number) => storeId ? stores.find(s => s.id === storeId)?.name || '-' : '-';

  const columns = [
    { key: 'name', header: t('branches.name') },
    { key: 'store', header: t('branches.store'), render: (b: Branch) => getStoreName(b.store_id) },
    { key: 'phone', header: t('branches.phone') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (branch: Branch) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(branch)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(branch.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('branches.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('branches.create')}
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table data={branches} columns={columns} keyExtractor={(b) => b.id} emptyMessage={t('branches.noBranches')} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? t('branches.edit') : t('branches.create')}
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
            label={t('branches.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('branches.store')} *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.storeId ? 'border-red-500' : ''}`}
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
            >
              <option value="">Selecciona una tienda</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {errors.storeId && <p className="mt-1 text-sm text-red-500">{errors.storeId}</p>}
          </div>
          <Input
            label={t('branches.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
