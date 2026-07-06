import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Table, Modal, Input, Skeleton, SkeletonTable, Pagination } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../api';
import type { Category, PaginationMeta } from '../../types';
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';
import { toast } from 'react-toastify';

export function CategoriesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissionResources } = useAuth();

  const canAccessCategories = (permissionResources['category']?.length ?? 0) > 0 || (permissionResources['item']?.length ?? 0) > 0;
  const noPermission = !canAccessCategories;

  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  const fetchCategories = async (p = page) => {
    try {
      setError('');
      const data = await api.getCategories(p);
      setCategories(data.categories);
      setMeta(data.meta);
    } catch (err) {
      const message = api.getErrorMessage(err);
      setError(message);
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(1); }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setIsLoading(true);
    fetchCategories(newPage);
  };

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
      toast.error(message);
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
        toast.error(message);
        console.error('Error deleting category:', err);
      }
    }
  };

  const columns = [
    { key: 'name', header: t('categories.name') },
    {
      key: 'active',
      header: t('categories.status'),
      render: (cat: Category) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          cat.active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {cat.active ? t('categories.active') : t('categories.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (category: Category) => (
        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(category.id)} className="text-red-500 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  if (noPermission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{t('categories.noPermission')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('categories.title')}</h1>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="w-4 h-4" />
          {t('categories.create')}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
            <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
            <SkeletonTable rows={4} cols={2} />
          </div>
        ) : (
          <Table data={categories} columns={columns} keyExtractor={(c) => c.id} emptyMessage={t('categories.noCategories')} onRowClick={(c) => navigate(`/categories/${c.id}/items`)} />
        )}
      </Card>

      <Pagination meta={meta} onPageChange={handlePageChange} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? t('categories.edit') : t('categories.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label={t('categories.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} required />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('categories.active')}</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

export default CategoriesPage;
