import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Table, Skeleton, SkeletonTable, EmptyState, Pagination } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Item, Branch, Category, InventoryExport, PaginationMeta } from '../../types';
import { Filter, RotateCcw, Package, Save, Power, Minus, Plus, Loader2, Download } from 'lucide-react';
import { toast } from 'react-toastify';

const QUANTITY_STATUS_OPTIONS = ['complete', 'low', 'empty'] as const;

export function InventoryPage() {
  const { t } = useTranslation();
  const { permissionResources } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const branchId = searchParams.get('branch_id') || '';
  const categoryId = searchParams.get('category_id') || '';
  const quantityStatus = searchParams.get('quantity_status') || '';
  const active = searchParams.get('active') || 'true';

  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, per_page: 20, total: 0, total_pages: 1 });
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Partial<Item>>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [exportData, setExportData] = useState<InventoryExport | null>(null);

  const canViewItems = (permissionResources['item']?.length ?? 0) > 0;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [branchesData, categoriesData] = await Promise.all([api.getBranches(), api.getCategories(1, 999)]);
        setBranches(branchesData);
        setCategories(categoriesData.categories);
      } catch (err) { console.error('Error fetching filter data:', err); }
    };
    fetchFilters();
  }, []);

  const fetchItems = async (p = page) => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, per_page: perPage };
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;
      const data = await api.getInventory(params);
      setItems(data.items);
      setMeta(data.meta);
      setPage(data.meta.page);
    } catch (err) { console.error('Error fetching inventory:', err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchItems(1); }, [branchId, categoryId, quantityStatus, active, perPage]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) { params.set(key, value); } else { params.delete(key); }
    setSearchParams(params);
  };

  const clearFilters = () => setSearchParams({});
  const hasFilters = branchId || categoryId || quantityStatus || active;
  const showBranchColumn = !branchId;

  const selectClass = "px-3 py-2 text-xs border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none transition-all";

  const draftKey = (item: Item) => `${item.id}-${item.branch_id || 0}`;

  const handleDraftChange = (item: Item, field: string, value: string) => {
    const key = draftKey(item);
    setDrafts(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  };

  const hasChanges = (item: Item) => {
    const key = draftKey(item);
    return drafts[key] !== undefined && Object.keys(drafts[key]).length > 0;
  };

  const getDraft = (item: Item, field: keyof Item): unknown => {
    const key = draftKey(item);
    return drafts[key]?.[field] ?? item[field];
  };

  const refetchInventory = async () => {
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;
      const data = await api.getInventory(params);
      setItems(data.items);
      setMeta(data.meta);
    } catch (err) { console.error('Error refetching inventory:', err); }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchItems(newPage);
  };

  const saveRow = async (item: Item) => {
    const key = draftKey(item);
    if (!hasChanges(item)) return;
    setSavingRow(key);
    try {
      const changes = drafts[key];
      const updateData: Record<string, unknown> = {};
      if ('name' in changes) updateData.name = changes.name;
      if ('measure' in changes) updateData.measure = changes.measure;
      if ('category_id' in changes) updateData.category_id = Number(changes.category_id);
      if ('current_quantity' in changes) updateData.current_quantity = Number(changes.current_quantity);
      if ('minimum_quantity' in changes) updateData.minimum_quantity = Number(changes.minimum_quantity);
      await api.updateItem(item.id, { ...updateData, branch_id: item.branch_id! });
      await refetchInventory();
      setDrafts(prev => { const next = { ...prev }; delete next[key]; return next; });
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error saving row:', err); }
    finally { setSavingRow(null); }
  };

  const toggleActive = async (item: Item) => {
    const key = draftKey(item);
    try {
      await api.updateItem(item.id, { active: !item.active, branch_id: item.branch_id! });
      await refetchInventory();
      setDrafts(prev => { const next = { ...prev }; delete next[key]; return next; });
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error toggling status:', err); }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;
      const result = await api.createInventoryExport(params);
      setExportData(result);
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); }
  };

  useEffect(() => {
    if (!exportData || exportData.status === 'completed' || exportData.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const result = await api.getInventoryExport(exportData.id);
        setExportData(result);
        if (result.status === 'completed') {
          const blob = await api.downloadInventoryExport(exportData.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inventario_${exportData.id}.csv`;
          document.body.appendChild(a); a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch { setExportData(null); }
    }, 2000);

    return () => clearInterval(interval);
  }, [exportData]);

  const statusLabels: Record<string, string> = {
    complete: t('inventory.qtyComplete'),
    low: t('inventory.qtyLow'),
    empty: t('inventory.qtyEmpty'),
  };

  const columns = [
    ...(showBranchColumn ? [{ key: 'branch_name' as const, header: t('branches.title'), render: (item: Item) => (<span className="text-gray-500 dark:text-gray-400 text-xs">{item.branch_name || '-'}</span>) }] : []),
    { key: 'name' as const, header: t('inventory.name'), render: (item: Item) => (
      <input value={getDraft(item, 'name') as string} onChange={(e) => handleDraftChange(item, 'name', e.target.value)}
        className="w-full min-w-[100px] px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm" />
    )},
    { key: 'category_name' as const, header: t('inventory.category'), render: (item: Item) => {
      const draftCategoryId = drafts[draftKey(item)]?.category_id;
      const currentCategoryId = draftCategoryId ?? item.category_id;
      return (
        <select value={String(currentCategoryId ?? '')} onChange={(e) => handleDraftChange(item, 'category_id', e.target.value)}
          className="min-w-[110px] px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-[var(--color-border)] dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      );
    }},
    { key: 'measure' as const, header: t('inventory.measure'), render: (item: Item) => (
      <input value={getDraft(item, 'measure') as string} onChange={(e) => handleDraftChange(item, 'measure', e.target.value)}
        className="w-20 px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm" />
    )},
    { key: 'current_quantity' as const, header: t('inventory.currentQuantity'), render: (item: Item) => {
      const value = String(getDraft(item, 'current_quantity') ?? '');
      return (
        <div className="flex items-center gap-0.5 group">
          <button type="button" onClick={() => { const c = Number(value) || 0; handleDraftChange(item, 'current_quantity', String(Math.max(0, c - 1))); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" value={value} onChange={(e) => handleDraftChange(item, 'current_quantity', e.target.value)}
            className="w-14 text-center py-0.5 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-gray-900 dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" onClick={() => { const c = Number(value) || 0; handleDraftChange(item, 'current_quantity', String(c + 1)); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }},
    { key: 'minimum_quantity' as const, header: t('inventory.minimumQuantity'), render: (item: Item) => {
      const value = String(getDraft(item, 'minimum_quantity') ?? '');
      return (
        <div className="flex items-center gap-0.5 group">
          <button type="button" onClick={() => { const c = Number(value) || 0; handleDraftChange(item, 'minimum_quantity', String(Math.max(0, c - 1))); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Minus className="w-3 h-3" />
          </button>
          <input type="number" value={value} onChange={(e) => handleDraftChange(item, 'minimum_quantity', e.target.value)}
            className="w-14 text-center py-0.5 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[var(--color-accent)] focus:outline-none text-gray-900 dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-[var(--color-accent)] transition-colors text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <button type="button" onClick={() => { const c = Number(value) || 0; handleDraftChange(item, 'minimum_quantity', String(c + 1)); }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      );
    }},
    { key: 'active' as const, header: t('inventory.status'), render: (item: Item) => (
      <button type="button" onClick={() => toggleActive(item)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
          item.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100'
        }`}>
        <Power className="w-3 h-3" />
        {item.active ? t('inventory.active') : t('inventory.inactive')}
      </button>
    )},
    { key: 'actions' as const, header: '', render: (item: Item) => {
      const changed = hasChanges(item);
      const key = draftKey(item);
      const isSaving = savingRow === key;
      return (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => saveRow(item)} disabled={!changed || isSaving}
            className={changed ? 'text-[var(--color-accent)]' : 'text-gray-300'}>
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          </Button>
        </div>
      );
    }},
  ];

  if (!canViewItems) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Package className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">{t('categories.noPermission')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('inventory.title')}</h1>
        <Button variant="primary" size="sm" onClick={handleExport}
          disabled={exportData?.status === 'pending' || exportData?.status === 'processing'}>
          {exportData?.status === 'pending' || exportData?.status === 'processing' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : <Download className="w-4 h-4" />}
          {exportData?.status === 'pending' || exportData?.status === 'processing'
            ? t('inventory.exporting')
            : exportData?.status === 'failed' ? t('inventory.exportFailed') : t('inventory.exportCsv')}
        </Button>
      </div>

      <div className="bg-[var(--color-surface)] dark:bg-gray-900 rounded-xl border border-[var(--color-border)] dark:border-gray-800 shadow-sm mb-6">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('inventory.filters')}</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-red-500 hover:text-red-600 text-xs">
                <RotateCcw className="w-3 h-3" />
                {t('common.clearFilters')}
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select value={branchId} onChange={(e) => updateFilter('branch_id', e.target.value)} className={`${selectClass} flex-1 min-w-[120px]`}>
              <option value="">{t('inventory.allBranches')}</option>
              {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
            <select value={categoryId} onChange={(e) => updateFilter('category_id', e.target.value)} className={`${selectClass} flex-1 min-w-[120px]`}>
              <option value="">{t('inventory.allCategories')}</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            <select value={quantityStatus} onChange={(e) => updateFilter('quantity_status', e.target.value)} className={`${selectClass} flex-1 min-w-[120px]`}>
              <option value="">{t('inventory.allStatus')}</option>
              {QUANTITY_STATUS_OPTIONS.map((s) => (<option key={s} value={s}>{statusLabels[s]}</option>))}
            </select>
            <select value={active} onChange={(e) => updateFilter('active', e.target.value)} className={`${selectClass} flex-1 min-w-[120px]`}>
              <option value="all">{t('inventory.allActive')}</option>
              <option value="true">{t('inventory.active')}</option>
              <option value="false">{t('inventory.inactive')}</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              <span>{t('pagination.perPage')}</span>
              <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-16 px-2 py-1.5 text-xs border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div>
            <div className="flex gap-3 mb-4">
              <Skeleton variant="rectangular" className="flex-1" height={38} />
              <Skeleton variant="rectangular" className="flex-1" height={38} />
              <Skeleton variant="rectangular" className="flex-1" height={38} />
              <Skeleton variant="rectangular" className="flex-1" height={38} />
            </div>
            <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
              <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
                <Skeleton variant="text" className="flex-1" height={14} />
                <Skeleton variant="text" className="flex-1" height={14} />
                <Skeleton variant="text" className="flex-1" height={14} />
                <Skeleton variant="text" width={100} height={14} />
                <Skeleton variant="text" width={80} height={14} />
              </div>
              <SkeletonTable rows={5} cols={4} />
            </div>
          </div>
        ) : (
          <>
            <div className="block min-[1230px]:hidden space-y-3">
              {items.length === 0 ? (
                <EmptyState icon={<Package className="w-8 h-8" />} title={t('inventory.noItems')} className="py-8" />
              ) : items.map((item) => {
                const qty = item.current_quantity;
                const min = item.minimum_quantity;
                const borderColor = qty == null || qty <= 0
                  ? 'border-red-300 dark:border-red-700 bg-red-100 dark:bg-red-900/40'
                  : min != null && qty < min
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/40'
                  : 'border-[var(--color-border)] dark:border-gray-700';
                const key = draftKey(item);
                return (
                  <div key={key} className={`rounded-xl border ${borderColor} bg-white dark:bg-gray-900 overflow-hidden`}>
                    <div className="p-4 space-y-3">
                      {showBranchColumn && item.branch_name && (
                        <div className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.branch_name}</div>
                      )}
                      <div className="flex items-start gap-2">
                        <input value={getDraft(item, 'name') as string} onChange={(e) => handleDraftChange(item, 'name', e.target.value)}
                          className="flex-1 text-sm font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent focus:border-[var(--color-accent)] focus:outline-none" />
                        <input value={getDraft(item, 'measure') as string} onChange={(e) => handleDraftChange(item, 'measure', e.target.value)}
                          className="w-16 text-right text-xs text-gray-500 dark:text-gray-400 bg-transparent border-b border-transparent focus:border-[var(--color-accent)] focus:outline-none" />
                      </div>
                      <select value={String(drafts[key]?.category_id ?? item.category_id ?? '')} onChange={(e) => handleDraftChange(item, 'category_id', e.target.value)}
                        className="w-full text-xs px-2 py-1.5 bg-white dark:bg-gray-900 border border-[var(--color-border)] dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <div className="flex gap-3">
                        {(['current_quantity', 'minimum_quantity'] as const).map((field) => (
                          <div key={field} className="flex-1">
                            <label className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5 block">{field === 'current_quantity' ? t('inventory.currentQuantity') : t('inventory.minimumQuantity')}</label>
                            <div className="flex items-center gap-0.5">
                              <button type="button" onClick={() => { const v = Number(getDraft(item, field) ?? 0); handleDraftChange(item, field, String(Math.max(0, v - 1))); }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-[var(--color-accent)]"><Minus className="w-3 h-3" /></button>
                              <input type="number" value={String(getDraft(item, field) ?? '')} onChange={(e) => handleDraftChange(item, field, e.target.value)}
                                className="w-12 text-center py-0.5 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-[var(--color-accent)] focus:outline-none text-gray-900 dark:text-gray-100 text-sm font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              <button type="button" onClick={() => { const v = Number(getDraft(item, field) ?? 0); handleDraftChange(item, field, String(v + 1)); }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-[var(--color-accent)]"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-[var(--color-border)] dark:border-gray-800">
                      <button type="button" onClick={() => toggleActive(item)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                          item.active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                        <Power className="w-3 h-3" />{item.active ? t('inventory.active') : t('inventory.inactive')}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => saveRow(item)} disabled={!hasChanges(item) || savingRow === key}
                        className={hasChanges(item) ? 'text-[var(--color-accent)]' : 'text-gray-300'}>
                        {savingRow === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden min-[1230px]:block">
              <Table data={items} columns={columns} keyExtractor={(item) => `${item.id}-${item.branch_id || 0}`}
                emptyMessage={t('inventory.noItems')}
                rowClassName={(item) => {
                  const qty = item.current_quantity;
                  const min = item.minimum_quantity;
                  if (qty == null || qty <= 0) return '!bg-red-100 dark:!bg-red-900/50';
                  if (min != null && qty < min) return '!bg-amber-100 dark:!bg-amber-900/50';
                  return '';
                }}
              />
            </div>
          </>
        )}
      </Card>

      <Pagination meta={meta} onPageChange={handlePageChange} />
    </div>
  );
}

export default InventoryPage;
