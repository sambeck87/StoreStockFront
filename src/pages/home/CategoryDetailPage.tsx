import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api';
import { Card, Button, Modal, Input, Table, Skeleton, SkeletonTable, EmptyState, Pagination } from '../../components/common';
import type { Item, Branch, Category, PaginationMeta } from '../../types';
import { ArrowLeft, Package, Filter, Trash2, Power, Save, Pencil, Plus, Minus } from 'lucide-react';
import { toast } from 'react-toastify';

const NumberControl = ({ label, value, onChange, prefix, decimals = false }: any) => {
  const handleDecrement = () => {
    const current = Number(value) || 0;
    const next = Math.max(0, current - 1);
    onChange(decimals ? next.toFixed(2) : String(next));
  };
  
  const handleIncrement = () => {
    const current = Number(value) || 0;
    const next = current + 1;
    onChange(decimals ? next.toFixed(2) : String(next));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    if (decimals && value) {
      const num = Number(value);
      if (!isNaN(num)) onChange(num.toFixed(2));
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative flex items-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all hover:shadow-md">
        {prefix && <span className="pl-4 pr-1 text-gray-500 dark:text-gray-400 font-medium">{prefix}</span>}
        <button 
          type="button"
          onClick={handleDecrement}
          className="flex-shrink-0 w-10 h-11 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        >
          <Minus className="w-4 h-4" />
        </button>
        
        <input
          type="number"
          step={decimals ? "0.01" : "1"}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full h-11 px-1 text-center bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none font-semibold text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        
        <button 
          type="button"
          onClick={handleIncrement}
          className="flex-shrink-0 w-10 h-11 flex items-center justify-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export function CategoryDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [category, setCategory] = useState<Category | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    branch_id: '',
    active: 'true',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [drafts, setDrafts] = useState<Record<number, Partial<Item>>>({});
  const [formData, setFormData] = useState({
    name: '',
    measure: '',
    cost: '',
    current_quantity: '',
    minimum_quantity: '',
    branch_id: 0,
  });

  const [branchesLoaded, setBranchesLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [categoryData, branchesData] = await Promise.all([
          api.getCategory(Number(id)),
          api.getBranches(),
        ]);
        setCategory(categoryData);
        setBranches(branchesData);
        if (branchesData.length > 0) {
          setFilters(prev => ({ ...prev, branch_id: String(branchesData[0].id) }));
        }
        setBranchesLoaded(true);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [id]);

  const fetchItems = async (p = page) => {
    if (!id || !branchesLoaded) return;
    setIsLoading(true);
    try {
      const params: { branch_id?: number; active?: boolean; page?: number; per_page?: number } = { page: p, per_page: perPage };

      if (filters.branch_id) {
        params.branch_id = Number(filters.branch_id);
      }

      if (filters.active !== '') {
        params.active = filters.active === 'true';
      }

      const data = await api.getCategoryItems(Number(id), params);
      setItems(data.items);
      setMeta(data.meta);
      setPage(data.meta.page);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchItems(1); }, [id, filters, perPage, branchesLoaded]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ branch_id: '', active: 'true' });
  };

  const hasActiveFilters = filters.branch_id !== '';

  const handleOpenModal = (item?: Item) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        measure: item.measure || '',
        cost: item.cost?.toString() || '',
        current_quantity: item.current_quantity?.toString() || '',
        minimum_quantity: item.minimum_quantity?.toString() || '',
        branch_id: filters.branch_id ? Number(filters.branch_id) : (branches[0]?.id || 0),
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        measure: '',
        cost: '',
        current_quantity: '',
        minimum_quantity: '',
        branch_id: filters.branch_id ? Number(filters.branch_id) : (branches[0]?.id || 0),
      });
    }
    setIsModalOpen(true);
  };

  const handleDraftChange = (id: number, field: string, value: string) => {
    setDrafts(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const hasChanges = (id: number) => {
    return drafts[id] !== undefined && Object.keys(drafts[id]).length > 0;
  };

  const saveInline = async (item: Item) => {
    if (!hasChanges(item.id)) return;
    try {
      const changes = drafts[item.id];
      const updateData: Record<string, unknown> = { ...changes };
      
      if ('cost' in changes) updateData.cost = Number(changes.cost);
      if ('current_quantity' in changes) updateData.current_quantity = Number(changes.current_quantity);
      if ('minimum_quantity' in changes) updateData.minimum_quantity = Number(changes.minimum_quantity);

      const updatedItem = await api.updateItem(item.id, { 
        ...updateData, 
        branch_id: filters.branch_id ? Number(filters.branch_id) : undefined 
      });
      
      setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, ...updatedItem } : i));
      
      setDrafts(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    } catch(err) {
      const message = api.getErrorMessage(err);
      toast.error(message);
      console.error('Error saving item inline:', err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      if (editingItem) {
        const updateData: Record<string, unknown> = {};
        if (formData.name) updateData.name = formData.name;
        if (formData.measure) updateData.measure = formData.measure;
        if (formData.cost) updateData.cost = Number(formData.cost);
        if (formData.current_quantity) updateData.current_quantity = Number(formData.current_quantity);
        if (formData.minimum_quantity) updateData.minimum_quantity = Number(formData.minimum_quantity);
        
        const updatedItem = await api.updateItem(editingItem.id, { 
          ...updateData,
          branch_id: formData.branch_id
        });
        setItems(prevItems => 
          prevItems.map(item => item.id === editingItem.id ? { ...item, ...updatedItem } : item)
        );
      } else {
        const newItemData: Record<string, unknown> = {};
        if (formData.name) newItemData.name = formData.name;
        if (formData.measure) newItemData.measure = formData.measure;
        if (formData.cost) newItemData.cost = Number(formData.cost);
        if (formData.current_quantity) newItemData.current_quantity = Number(formData.current_quantity);
        if (formData.minimum_quantity) newItemData.minimum_quantity = Number(formData.minimum_quantity);
        newItemData.active = true;
        newItemData.branch_id = formData.branch_id;

        await api.createItem({ ...newItemData, category_id: Number(id) });
        
        await fetchItems(page);
      }
      setIsModalOpen(false);
    } catch (err) {
      const message = api.getErrorMessage(err);
      toast.error(message);
      console.error('Error saving item:', err);
    }
  };

  const handleDelete = async (itemId: number) => {
    if (window.confirm(t('items.confirmDelete'))) {
      try {
        await api.deleteItem(itemId, {
          branch_id: filters.branch_id ? Number(filters.branch_id) : undefined,
          category_id: Number(id)
        });

        await fetchItems(page);
      } catch (err) {
        const message = api.getErrorMessage(err);
        toast.error(message);
        console.error('Error deleting item:', err);
      }
    }
  };

  const handleToggleStatus = async (item: Item) => {
    try {
      const updatedItem = await api.updateItem(item.id, { 
        active: !item.active,
        branch_id: filters.branch_id ? Number(filters.branch_id) : undefined 
      });
      setItems(prevItems => 
        prevItems.map(i => i.id === item.id ? { ...i, ...updatedItem } : i)
      );
    } catch (err) {
      const message = api.getErrorMessage(err);
      toast.error(message);
      console.error('Error toggling status:', err);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Artículo',
      render: (item: Item) => (
        <input
          value={drafts[item.id]?.name ?? item.name}
          onChange={(e) => handleDraftChange(item.id, 'name', e.target.value)}
          className="w-full min-w-[120px] px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors"
        />
      )
    },
    {
      key: 'current_quantity',
      header: 'Disponibles',
      render: (item: Item) => {
        const value = drafts[item.id]?.current_quantity ?? item.current_quantity ?? '';
        return (
          <div className="flex items-center gap-1 group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const current = Number(value) || 0;
                handleDraftChange(item.id, 'current_quantity', String(Math.max(0, current - 1)));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={value}
              onChange={(e) => handleDraftChange(item.id, 'current_quantity', e.target.value)}
              className="w-16 text-center px-1 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-blue-600 dark:text-blue-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const current = Number(value) || 0;
                handleDraftChange(item.id, 'current_quantity', String(current + 1));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        );
      }
    },
    {
      key: 'measure',
      header: 'Unidad de medida',
      render: (item: Item) => (
        <input
          value={drafts[item.id]?.measure ?? item.measure ?? ''}
          onChange={(e) => handleDraftChange(item.id, 'measure', e.target.value)}
          className="w-24 px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors"
        />
      )
    },
    {
      key: 'minimum_quantity',
      header: 'Cantidad mínima',
      render: (item: Item) => {
        const value = drafts[item.id]?.minimum_quantity ?? item.minimum_quantity ?? '';
        return (
          <div className="flex items-center gap-1 group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                const current = Number(value) || 0;
                handleDraftChange(item.id, 'minimum_quantity', String(Math.max(0, current - 1)));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={value}
              onChange={(e) => handleDraftChange(item.id, 'minimum_quantity', e.target.value)}
              className="w-16 text-center px-1 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                const current = Number(value) || 0;
                handleDraftChange(item.id, 'minimum_quantity', String(Math.max(0, current - 1)));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        );
      }
    },
    {
      key: 'cost',
      header: 'Costo',
      render: (item: Item) => {
        const draftValue = drafts[item.id]?.cost;
        const displayValue = draftValue !== undefined 
          ? draftValue 
          : (item.cost !== undefined && item.cost !== null ? Number(item.cost).toFixed(2) : '');

        return (
          <div className="flex items-center">
            <span className="text-gray-500 dark:text-gray-400 mr-1">$</span>
            <input
              type="number"
              step="0.01"
              value={displayValue}
              onChange={(e) => handleDraftChange(item.id, 'cost', e.target.value)}
              className="w-20 px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        );
      }
    },
    {
      key: 'active',
      header: 'Estado',
      render: (item: Item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(item);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            item.active 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={item.active ? 'Desactivar' : 'Activar'}
        >
          <Power className="w-3 h-3" />
          {item.active ? 'Activo' : 'Inactivo'}
        </button>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (item: Item) => {
        const changed = hasChanges(item.id);
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => saveInline(item)}
              disabled={!changed}
              className={changed ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}
              title="Guardar cambios"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {category?.name || t('items.title')}
        </h1>

        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Filter className="w-4 h-4" />
          </div>

          <select
            value={filters.branch_id}
            onChange={(e) => handleFilterChange('branch_id', e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>

          <select
            value={filters.active}
            onChange={(e) => handleFilterChange('active', e.target.value)}
            className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="true">{t('items.active')}</option>
            <option value="false">{t('items.inactive')}</option>
            <option value="">{t('items.allStatus')}</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            <span>{t('pagination.perPage')}</span>
            <select
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
              className="w-16 px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('common.clearFilters')}
            </Button>
          )}

          <Button onClick={() => handleOpenModal()}>
            <Package className="w-4 h-4 mr-2" />
            {t('items.create')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="overflow-hidden" noPadding>
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
        <>
          <div className="hidden lg:block">
            <Card className="overflow-hidden" noPadding>
              <Table 
                data={items} 
                columns={columns} 
                keyExtractor={(i) => i.id} 
                emptyMessage={t('items.noItems')}
                rowClassName={(item) => {
                  const qty = item.current_quantity;
                  const min = item.minimum_quantity;
                  if (qty == null || qty <= 0) return '!bg-red-100 dark:!bg-red-900/50';
                  if (min != null && qty < min) return '!bg-amber-100 dark:!bg-amber-900/50';
                  return '';
                }}
              />
            </Card>
            <Pagination meta={meta} onPageChange={(p) => { setPage(p); fetchItems(p); }} />
          </div>

          <div className="lg:hidden space-y-4">
            {items.map((item) => {
              const isLowStock = item.current_quantity !== undefined && item.minimum_quantity !== undefined && item.current_quantity < item.minimum_quantity;
              return (
                <Card key={item.id} className={`${isLowStock ? '!border-red-300 dark:!border-red-700 !bg-red-50/60 dark:!bg-red-900/20' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      {item.measure && <p className="text-sm text-gray-500 dark:text-gray-400">{item.measure}</p>}
                    </div>
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {item.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Disponibles:</span>
                      <span className={`ml-2 font-medium ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                        {item.current_quantity ?? '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Mínimo:</span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">{item.minimum_quantity ?? '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Costo:</span>
                      <span className="ml-2 text-gray-700 dark:text-gray-300">
                        {item.cost !== undefined && item.cost !== null ? `$${Number(item.cost).toFixed(2)}` : '-'}
                      </span>
                    </div>
                    {item.price && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Precio:</span>
                        <span className="ml-2 text-gray-700 dark:text-gray-300">${Number(item.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)} className="flex-1">
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
            <Pagination meta={meta} onPageChange={(p) => { setPage(p); fetchItems(p); }} />
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('items.edit') : t('items.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-5 pt-2">

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Información Principal</h3>
              <div className="space-y-4">
                <Input
                  label={t('items.name')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t('items.measure')}
                    value={formData.measure}
                    onChange={(e) => setFormData({ ...formData, measure: e.target.value })}
                    placeholder="ej: litros, cajas"
                  />
                  <NumberControl
                    label={t('items.cost')}
                    value={formData.cost}
                    onChange={(val: string) => setFormData({ ...formData, cost: val })}
                    prefix="$"
                    decimals={true}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Control de Inventario</h3>
              <div className="grid grid-cols-2 gap-4">
                <NumberControl
                  label={t('items.currentQuantity')}
                  value={formData.current_quantity}
                  onChange={(val: string) => setFormData({ ...formData, current_quantity: val })}
                />
                <NumberControl
                  label={t('items.minimumQuantity')}
                  value={formData.minimum_quantity}
                  onChange={(val: string) => setFormData({ ...formData, minimum_quantity: val })}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default CategoryDetailPage;
