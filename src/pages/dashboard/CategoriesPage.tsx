import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import type { Category } from '../../types';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissionResources } = useAuth();

  const hasCategoryPermission = (permissionResources['category']?.length ?? 0) > 0;
  const noPermission = !hasCategoryPermission;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  const fetchCategories = async () => {
    try {
      setError('');
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      const message = api.getErrorMessage(err);
      setError(message);
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category?: Category) => {
    setErrors({});
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, active: category.active ?? true });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', active: true });
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
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory(formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      const message = api.getErrorMessage(err);
      alert(message);
      console.error('Error saving category:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(t('categories.confirmDelete'))) {
      try {
        await api.deleteCategory(id);
        fetchCategories();
      } catch (err) {
        const message = api.getErrorMessage(err);
        alert(message);
        console.error('Error deleting category:', err);
      }
    }
  };

  const handleViewItems = (categoryId: number) => {
    navigate(`/categories/${categoryId}/items`);
  };

  const columns = [
    { key: 'name', header: t('categories.name') },
    { 
      key: 'active', 
      header: t('categories.status'),
      render: (cat: Category) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${cat.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {cat.active ? t('categories.active') : t('categories.inactive')}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (category: Category) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (noPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400 text-center max-w-md">
          {t('categories.noPermission')}
        </h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('categories.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('categories.create')}
        </Button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table data={categories} columns={columns} keyExtractor={(c) => c.id} emptyMessage={t('categories.noCategories')} onRowClick={(c) => handleViewItems(c.id)} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t('categories.edit') : t('categories.create')}
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
            label={t('categories.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('categories.active')}</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
