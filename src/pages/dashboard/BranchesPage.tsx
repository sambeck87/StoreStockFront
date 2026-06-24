import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Branch } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

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
      setFormData({
        name: branch.name,
        phone: branch.phone || '',
      });
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
        await api.updateBranch(editingBranch.id, {
          name: formData.name,
          phone: formData.phone || undefined,
        });
      } else {
        if (!user?.store_id) {
          alert('No tienes una tienda asignada');
          return;
        }
        await api.createBranch({
          name: formData.name,
          phone: formData.phone || undefined,
          store_id: user.store_id,
        });
      }
      setIsModalOpen(false);
      fetchBranches();
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
        fetchBranches();
      } catch (error) {
        const message = api.getErrorMessage(error);
        alert(message);
        console.error('Error deleting branch:', error);
      }
    }
  };

  const columns = [
    { key: 'name', header: t('branches.name') },
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
