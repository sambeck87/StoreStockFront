import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Card, Button, Modal, Input, Table } from '../../components/common';
import type { Item, Branch } from '../../types';
import { ArrowLeft, Package, Trash2, Power, Save, Plus, Minus } from 'lucide-react';
import { Skeleton, SkeletonTable, EmptyState } from '../../components/common';
import { toast } from 'react-toastify';

const NumberControl = ({ label, value, onChange, prefix, decimals = false }: any) => {
  const handleDecrement = () => { const c = Number(value) || 0; onChange(decimals ? (Math.max(0, c - 1)).toFixed(2) : String(Math.max(0, c - 1))); };
  const handleIncrement = () => { const c = Number(value) || 0; onChange(decimals ? (c + 1).toFixed(2) : String(c + 1)); };

  return (
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative flex items-center bg-white dark:bg-gray-900 border border-[var(--color-border)] dark:border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[var(--color-accent)]/30 focus-within:border-[var(--color-accent)] transition-all">
        {prefix && <span className="pl-3 pr-0.5 text-xs text-gray-400 font-medium">{prefix}</span>}
        <button type="button" onClick={handleDecrement}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[var(--color-accent)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none">
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input type="number" step={decimals ? "0.01" : "1"} value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-1 text-center bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none font-semibold text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        <button type="button" onClick={handleIncrement}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-gray-400 hover:text-[var(--color-accent)] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export function CategoryItemsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [filters, setFilters] = useState({ branch_id: '', active: 'true' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Partial<Item>>>({});
  const [formData, setFormData] = useState({ name: '', measure: '', cost: '', current_quantity: '', minimum_quantity: '', branch_id: 0 });
  const [branchesLoaded, setBranchesLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (id) api.getCategory(Number(id)).then(cat => setCategoryName(cat.name)).catch(() => {}); }, [id]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await api.getUserBranches();
        setBranches(data);
        if (data.length > 0) setFilters(prev => ({ ...prev, branch_id: String(data[0].id) }));
      } catch (error) { console.error('Error fetching branches:', error); }
      finally { setBranchesLoaded(true); }
    };
    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (!id || !branchesLoaded || !filters.branch_id) return;
      setIsLoading(true);
      try {
        const params: { category_id: number; active?: boolean } = { category_id: Number(id) };
        if (filters.active !== '') params.active = filters.active === 'true';
        const data = await api.getBranchItems(Number(filters.branch_id), params);
        setItems(data);
      } catch (error) { console.error('Error fetching items:', error); setItems([]); }
      finally { setIsLoading(false); }
    };
    fetchItems();
  }, [id, filters, branchesLoaded, refreshKey]);

  const handleFilterChange = (key: string, value: string) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters(prev => ({ ...prev, active: 'true' }));
  const hasActiveFilters = filters.active !== 'true';

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name, measure: item.measure || '', cost: item.cost?.toString() || '',
        current_quantity: item.current_quantity?.toString() || '', minimum_quantity: item.minimum_quantity?.toString() || '',
        branch_id: filters.branch_id ? Number(filters.branch_id) : (branches[0]?.id || 0),
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', measure: '', cost: '', current_quantity: '', minimum_quantity: '', branch_id: filters.branch_id ? Number(filters.branch_id) : (branches[0]?.id || 0) });
    }
    setIsModalOpen(true);
  };

  const handleDraftChange = (itemId: number, field: string, value: string) => {
    setDrafts(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: value } }));
  };

  const hasChanges = (itemId: number) => drafts[itemId] !== undefined && Object.keys(drafts[itemId]).length > 0;

  const saveInline = async (item: Item) => {
    if (!hasChanges(item.id)) return;
    try {
      const changes = drafts[item.id];
      const updateData: Record<string, unknown> = { ...changes };
      if ('cost' in changes) updateData.cost = Number(changes.cost);
      if ('current_quantity' in changes) updateData.current_quantity = Number(changes.current_quantity);
      if ('minimum_quantity' in changes) updateData.minimum_quantity = Number(changes.minimum_quantity);
      const updatedItem = await api.updateItem(item.id, { ...updateData, branch_id: filters.branch_id ? Number(filters.branch_id) : undefined });
      setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, ...updatedItem } : i));
      setDrafts(prev => { const next = { ...prev }; delete next[item.id]; return next; });
    } catch(err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error saving item inline:', err); }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('El nombre es requerido'); return; }
    try {
      if (editingItem) {
        const updateData: Record<string, unknown> = {};
        if (formData.name) updateData.name = formData.name;
        if (formData.measure) updateData.measure = formData.measure;
        if (formData.cost) updateData.cost = Number(formData.cost);
        if (formData.current_quantity) updateData.current_quantity = Number(formData.current_quantity);
        if (formData.minimum_quantity) updateData.minimum_quantity = Number(formData.minimum_quantity);
        const updatedItem = await api.updateItem(editingItem.id, { ...updateData, branch_id: formData.branch_id });
        setItems(prevItems => prevItems.map(item => item.id === editingItem.id ? { ...item, ...updatedItem } : item));
      } else {
        const newItemData: Record<string, unknown> = {};
        if (formData.name) newItemData.name = formData.name;
        if (formData.measure) newItemData.measure = formData.measure;
        if (formData.cost) newItemData.cost = Number(formData.cost);
        if (formData.current_quantity) newItemData.current_quantity = Number(formData.current_quantity);
        if (formData.minimum_quantity) newItemData.minimum_quantity = Number(formData.minimum_quantity);
        newItemData.active = true; newItemData.branch_id = formData.branch_id;
        await api.createItem({ ...newItemData, category_id: Number(id) });
      }
      setIsModalOpen(false);
      setRefreshKey(k => k + 1);
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error saving item:', err); }
  };

  const handleDelete = async (itemId: number) => {
    if (window.confirm(t('items.confirmDelete'))) {
      try { await api.deleteItem(itemId, { branch_id: filters.branch_id ? Number(filters.branch_id) : undefined, category_id: Number(id) }); setRefreshKey(k => k + 1); }
      catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error deleting item:', err); }
    }
  };

  const handleToggleStatus = async (item: Item) => {
    try {
      const updatedItem = await api.updateItem(item.id, { active: !item.active, branch_id: filters.branch_id ? Number(filters.branch_id) : undefined });
      setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, ...updatedItem } : i));
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error toggling status:', err); }
  };

  const columns = [
    { key: 'name', header: 'Artículo', render: (item: Item) => (
      <input value={drafts[item.id]?.name ?? item.name} onChange={(e) => handleDraftChange(item.id, 'name', e.target.value)}
        className="w-full min-w-[100px] px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm" />
    )},
    { key: 'current_quantity', header: 'Disponibles', render: (item: Item) => {
      const value = drafts[item.id]?.current_quantity ?? item.current_quantity ?? '';
      return (
        <div className="flex items-center gap-0.5 group">
          <button onClick={(e) => { e.stopPropagation(); const c = Number(value) || 0; handleDraftChange(item.id, 'current_quantity', String(Math.max(0, c - 1))); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" value={value} onChange={(e) => handleDraftChange(item.id, 'current_quantity', e.target.value)}
            className="w-14 text-center py-0.5 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-accent)] dark:text-emerald-400 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button onClick={(e) => { e.stopPropagation(); const c = Number(value) || 0; handleDraftChange(item.id, 'current_quantity', String(c + 1)); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }},
    { key: 'measure', header: 'Unidad', render: (item: Item) => (
      <input value={drafts[item.id]?.measure ?? item.measure ?? ''} onChange={(e) => handleDraftChange(item.id, 'measure', e.target.value)}
        className="w-20 px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-gray-500 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm" />
    )},
    { key: 'minimum_quantity', header: 'Mínimo', render: (item: Item) => {
      const value = drafts[item.id]?.minimum_quantity ?? item.minimum_quantity ?? '';
      return (
        <div className="flex items-center gap-0.5 group">
          <button onClick={(e) => { e.stopPropagation(); const c = Number(value) || 0; handleDraftChange(item.id, 'minimum_quantity', String(Math.max(0, c - 1))); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" value={value} onChange={(e) => handleDraftChange(item.id, 'minimum_quantity', e.target.value)}
            className="w-14 text-center py-0.5 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button onClick={(e) => { e.stopPropagation(); const c = Number(value) || 0; handleDraftChange(item.id, 'minimum_quantity', String(Math.max(0, c + 1))); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }},
    { key: 'cost', header: 'Costo', render: (item: Item) => {
      const draftValue = drafts[item.id]?.cost;
      const displayValue = draftValue !== undefined ? draftValue : (item.cost !== undefined && item.cost !== null ? Number(item.cost).toFixed(2) : '');
      return (
        <div className="flex items-center">
          <span className="text-gray-400 text-xs mr-0.5">$</span>
          <input type="number" step="0.01" value={displayValue} onChange={(e) => handleDraftChange(item.id, 'cost', e.target.value)}
            className="w-16 px-1 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
        </div>
      );
    }},
    { key: 'active', header: 'Estado', render: (item: Item) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(item); }}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
          item.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'
        }`}>
        <Power className="w-3 h-3" />
        {item.active ? 'Activo' : 'Inactivo'}
      </button>
    )},
    { key: 'actions', header: '', render: (item: Item) => {
      const changed = hasChanges(item.id);
      return (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => saveInline(item)} disabled={!changed}
            className={changed ? 'text-[var(--color-accent)]' : 'text-gray-300'} title="Guardar cambios">
            <Save className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      );
    }},
  ];

  return (
    <div>
      <button onClick={() => navigate('/categories')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('common.back')}
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{categoryName || t('items.title')}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <select value={filters.branch_id} onChange={(e) => handleFilterChange('branch_id', e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
              {branches.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
            </select>
            <select value={filters.active} onChange={(e) => handleFilterChange('active', e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
              <option value="true">{t('items.active')}</option>
              <option value="false">{t('items.inactive')}</option>
              <option value="">{t('items.allStatus')}</option>
            </select>
            {hasActiveFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>{t('common.clearFilters')}</Button>}
          </div>
          <Button onClick={() => handleOpenModal()} size="sm">
            <Package className="w-4 h-4" />
            {t('items.create')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
            <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
            <SkeletonTable rows={4} cols={3} />
          </div>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState icon={<Package className="w-8 h-8" />} title={t('items.noItems')} />
      ) : (
        <Card>
          <Table data={items} columns={columns} keyExtractor={(i) => i.id} emptyMessage={t('items.noItems')}
            rowClassName={(item) => {
              const qty = item.current_quantity;
              const min = item.minimum_quantity;
              if (qty == null || qty <= 0) return '!bg-red-100 dark:!bg-red-900/50';
              if (min != null && qty < min) return '!bg-amber-100 dark:!bg-amber-900/50';
              return '';
            }}
          />
        </Card>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('items.edit') : t('items.create')}
        footer={<><Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button><Button onClick={handleSubmit}>{t('common.save')}</Button></>}
      >
        <div className="space-y-4">
          <Input label={t('items.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('items.measure')} value={formData.measure} onChange={(e) => setFormData({ ...formData, measure: e.target.value })} placeholder="ej: litros" />
            <NumberControl label={t('items.cost')} value={formData.cost} onChange={(val: string) => setFormData({ ...formData, cost: val })} prefix="$" decimals />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumberControl label={t('items.currentQuantity')} value={formData.current_quantity} onChange={(val: string) => setFormData({ ...formData, current_quantity: val })} />
            <NumberControl label={t('items.minimumQuantity')} value={formData.minimum_quantity} onChange={(val: string) => setFormData({ ...formData, minimum_quantity: val })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CategoryItemsPage;
