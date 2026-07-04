import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input, Skeleton, SkeletonTable } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Branch } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';
import { toast } from 'react-toastify';

export function BranchesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const fetchBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleOpenModal = (branch?: Branch) => {
    setErrors({});
    if (branch) {
      setEditingBranch(branch);
      setFormData({ name: branch.name, phone: branch.phone || '' });
    } else {
      setEditingBranch(null);
      setFormData({ name: '', phone: '' });
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
      if (editingBranch) {
        await api.updateBranch(editingBranch.id, { name: formData.name, phone: formData.phone || undefined });
      } else {
        if (!user?.store_id) {
          toast.error('No tienes una tienda asignada');
          return;
        }
        await api.createBranch({ name: formData.name, phone: formData.phone || undefined, store_id: user.store_id });
      }
      setIsModalOpen(false);
      fetchBranches();
    } catch (error) {
      const message = api.getErrorMessage(error);
      toast.error(message);
      console.error('Error saving branch:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('branches.confirmDelete'))) {
      try {
        await api.deleteBranch(id);
        fetchBranches();
      } catch (error) {
        const message = api.getErrorMessage(error);
        toast.error(message);
        console.error('Error deleting branch:', error);
      }
    }
  };

  const columns = [
    { key: 'name', header: t('branches.name') },
    { key: 'phone', header: t('branches.phone') },
    {
      key: 'actions',
      header: '',
      render: (branch: Branch) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(branch)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(branch.id)} className="text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('branches.title')}</h1>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="w-4 h-4" />
          {t('branches.create')}
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
            <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
            <SkeletonTable rows={4} cols={2} />
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
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('branches.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} required />
          <Input label={t('branches.phone')} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

export default BranchesPage;
