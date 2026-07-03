import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Table } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Item, Branch, Category } from '../../types';
import { Filter, RotateCcw, Package, Save, Power, Minus, Plus, Download } from 'lucide-react';

const QUANTITY_STATUS_OPTIONS = ['complete', 'low', 'empty'] as const;

export function InventoryPage() {
  const { t } = useTranslation();
  const { permissionResources } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const branchId = searchParams.get('branch_id') || '';
  const categoryId = searchParams.get('category_id') || '';
  const quantityStatus = searchParams.get('quantity_status') || '';
  const active = searchParams.has('active') ? searchParams.get('active')! : 'true';

  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, Partial<Item>>>({});
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [exportData, setExportData] = useState<{ id: number; status: string; error?: string } | null>(null);

  const canViewItems = (permissionResources['item']?.length ?? 0) > 0;

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [branchesData, categoriesData] = await Promise.all([
          api.getBranches(),
          api.getCategories(),
        ]);
        setBranches(branchesData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Error fetching filter data:', err);
      }
    };
    fetchFilters();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;

      const data = await api.getInventory(params);
      setItems(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [branchId, categoryId, quantityStatus, active]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = branchId || categoryId || quantityStatus || active;
  const showBranchColumn = !branchId;

  const selectClass = "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none";

  const draftKey = (item: Item) => `${item.id}-${item.branch_id || 0}`;

  const handleDraftChange = (item: Item, field: string, value: string) => {
    const key = draftKey(item);
    setDrafts(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
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
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;
      const data = await api.getInventory(params);
      setItems(data);
    } catch (err) {
      console.error('Error refetching inventory:', err);
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      if (categoryId) params.category_id = categoryId;
      if (quantityStatus) params.quantity_status = quantityStatus;
      if (active) params.active = active;

      const exportResult = await api.createInventoryExport(params);
      setExportData({ id: exportResult.id, status: exportResult.status });
    } catch (err) {
      const message = api.getErrorMessage(err);
      alert(message);
    }
  };

  useEffect(() => {
    if (!exportData || exportData.status === 'completed' || exportData.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const result = await api.getInventoryExport(exportData.id);
        setExportData({ id: result.id, status: result.status, error: result.error_message ?? undefined });

        if (result.status === 'completed') {
          const blob = await api.downloadInventoryExport(exportData.id);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `inventario_${exportData.id}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch {
        setExportData(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [exportData]);

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
      setDrafts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      const message = api.getErrorMessage(err);
      alert(message);
      console.error('Error saving row:', err);
    } finally {
      setSavingRow(null);
    }
  };

  const toggleActive = async (item: Item) => {
    const key = draftKey(item);
    try {
      await api.updateItem(item.id, { active: !item.active, branch_id: item.branch_id! });
      await refetchInventory();
      setDrafts(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      const message = api.getErrorMessage(err);
      alert(message);
      console.error('Error toggling status:', err);
    }
  };

  const statusLabels: Record<string, string> = {
    complete: t('inventory.qtyComplete'),
    low: t('inventory.qtyLow'),
    empty: t('inventory.qtyEmpty'),
  };

  const columns = [
    ...(showBranchColumn
      ? [{
          key: 'branch_name' as const,
          header: t('branches.title'),
          render: (item: Item) => (
            <span className="text-gray-500 dark:text-gray-400">{item.branch_name || '-'}</span>
          ),
        }]
      : []),
    {
      key: 'name' as const,
      header: t('inventory.name'),
      render: (item: Item) => (
        <input
          value={getDraft(item, 'name') as string}
          onChange={(e) => handleDraftChange(item, 'name', e.target.value)}
          className="w-full min-w-[120px] px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors"
        />
      ),
    },
    {
      key: 'category_name' as const,
      header: t('inventory.category'),
      render: (item: Item) => {
        const draftCategoryId = drafts[draftKey(item)]?.category_id;
        const currentCategoryId = draftCategoryId ?? item.category_id;
        return (
          <select
            value={String(currentCategoryId ?? '')}
            onChange={(e) => handleDraftChange(item, 'category_id', e.target.value)}
            className="w-full min-w-[120px] px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'measure' as const,
      header: t('inventory.measure'),
      render: (item: Item) => (
        <input
          value={getDraft(item, 'measure') as string}
          onChange={(e) => handleDraftChange(item, 'measure', e.target.value)}
          className="w-24 px-2 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors"
        />
      ),
    },
    {
      key: 'current_quantity' as const,
      header: t('inventory.currentQuantity'),
      render: (item: Item) => {
        const value = String(getDraft(item, 'current_quantity') ?? '');
        return (
          <div className="flex items-center gap-1 group">
            <button
              type="button"
              onClick={() => {
                const current = Number(value) || 0;
                handleDraftChange(item, 'current_quantity', String(Math.max(0, current - 1)));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={value}
              onChange={(e) => handleDraftChange(item, 'current_quantity', e.target.value)}
              className="w-16 text-center px-1 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-blue-600 dark:text-blue-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => {
                const current = Number(value) || 0;
                handleDraftChange(item, 'current_quantity', String(current + 1));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'minimum_quantity' as const,
      header: t('inventory.minimumQuantity'),
      render: (item: Item) => {
        const value = String(getDraft(item, 'minimum_quantity') ?? '');
        return (
          <div className="flex items-center gap-1 group">
            <button
              type="button"
              onClick={() => {
                const current = Number(value) || 0;
                handleDraftChange(item, 'minimum_quantity', String(Math.max(0, current - 1)));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={value}
              onChange={(e) => handleDraftChange(item, 'minimum_quantity', e.target.value)}
              className="w-16 text-center px-1 py-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-gray-600 dark:text-gray-400 dark:hover:border-gray-600 dark:focus:border-blue-400 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => {
                const current = Number(value) || 0;
                handleDraftChange(item, 'minimum_quantity', String(current + 1));
              }}
              className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'active' as const,
      header: t('inventory.status'),
      render: (item: Item) => (
        <button
          type="button"
          onClick={() => toggleActive(item)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            item.active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title={item.active ? t('common.disable') : t('common.enable')}
        >
          <Power className="w-3 h-3" />
          {item.active ? t('inventory.active') : t('inventory.inactive')}
        </button>
      ),
    },
    {
      key: 'actions' as const,
      header: '',
      render: (item: Item) => {
        const changed = hasChanges(item);
        const key = draftKey(item);
        const isSaving = savingRow === key;
        return (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => saveRow(item)}
              disabled={!changed || isSaving}
              className={changed ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

  if (!canViewItems) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-gray-400" />
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('inventory.title')}</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={handleExport}
          disabled={exportData?.status === 'pending' || exportData?.status === 'processing'}
        >
          {exportData?.status === 'pending' || exportData?.status === 'processing' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {exportData?.status === 'pending' || exportData?.status === 'processing'
            ? t('inventory.exporting')
            : exportData?.status === 'failed'
            ? t('inventory.exportFailed')
            : t('inventory.exportCsv')}
        </Button>
      </div>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('inventory.filters')}</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-red-500 hover:text-red-600">
                <RotateCcw className="w-4 h-4 mr-1" />
                {t('common.clearFilters')}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <select
              value={branchId}
              onChange={(e) => updateFilter('branch_id', e.target.value)}
              className={selectClass}
            >
              <option value="">{t('inventory.allBranches')}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <select
              value={categoryId}
              onChange={(e) => updateFilter('category_id', e.target.value)}
              className={selectClass}
            >
              <option value="">{t('inventory.allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={quantityStatus}
              onChange={(e) => updateFilter('quantity_status', e.target.value)}
              className={selectClass}
            >
              <option value="">{t('inventory.allStatus')}</option>
              {QUANTITY_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusLabels[s]}</option>
              ))}
            </select>
            <select
              value={active}
              onChange={(e) => updateFilter('active', e.target.value)}
              className={selectClass}
            >
              <option value="">{t('inventory.allActive')}</option>
              <option value="true">{t('inventory.active')}</option>
              <option value="false">{t('inventory.inactive')}</option>
            </select>
          </div>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="block min-[1230px]:hidden p-4">
              <div className="grid grid-cols-1 min-[946px]:grid-cols-2 gap-3">
              {items.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-gray-400">{t('inventory.noItems')}</p>
              ) : items.map((item) => {
                const qty = item.current_quantity;
                const min = item.minimum_quantity;
                const cardBorder = qty == null || qty <= 0
                  ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20'
                  : min != null && qty < min
                  ? 'border-purple-300 dark:border-fuchsia-700 bg-purple-50/50 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700';
                const key = draftKey(item);
                return (
                  <div key={key} className={`rounded-xl border ${cardBorder} bg-white dark:bg-gray-800/80 overflow-hidden`}>
                    <div className="p-4 space-y-3">
                      {showBranchColumn && item.branch_name && (
                        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.branch_name}</div>
                      )}
                      <div className="flex items-start gap-2">
                        <input value={getDraft(item, 'name') as string} onChange={(e) => handleDraftChange(item, 'name', e.target.value)}
                          className="flex-1 text-base font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none" />
                        <input value={getDraft(item, 'measure') as string} onChange={(e) => handleDraftChange(item, 'measure', e.target.value)}
                          className="w-20 text-right text-sm text-gray-500 dark:text-gray-400 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none" />
                      </div>
                      <select value={String(drafts[key]?.category_id ?? item.category_id ?? '')} onChange={(e) => handleDraftChange(item, 'category_id', e.target.value)}
                        className="w-full text-sm px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300">
                        {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                      </select>
                      <div className="flex gap-3">
                        {(['current_quantity', 'minimum_quantity'] as const).map((field) => (
                          <div key={field} className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{field === 'current_quantity' ? t('inventory.currentQuantity') : t('inventory.minimumQuantity')}</label>
                            <div className="flex items-center gap-1">
                              <button type="button" onClick={() => { const v = Number(getDraft(item, field) ?? 0); handleDraftChange(item, field, String(Math.max(0, v - 1))); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"><Minus className="w-3 h-3" /></button>
                              <input type="number" value={String(getDraft(item, field) ?? '')} onChange={(e) => handleDraftChange(item, field, e.target.value)}
                                className="w-14 text-center py-1 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                              <button type="button" onClick={() => { const v = Number(getDraft(item, field) ?? 0); handleDraftChange(item, field, String(v + 1)); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"><Plus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                      <button type="button" onClick={() => toggleActive(item)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${item.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-400'}`}>
                        <Power className="w-3 h-3" />{item.active ? t('inventory.active') : t('inventory.inactive')}
                      </button>
                      <Button variant="ghost" size="sm" onClick={() => saveRow(item)} disabled={!hasChanges(item) || savingRow === key}
                        className={hasChanges(item) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
                        {savingRow === key ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" /> : <Save className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
            <div className="hidden min-[1230px]:block">
              <Table
                data={items}
                columns={columns}
                keyExtractor={(item) => `${item.id}-${item.branch_id || 0}`}
                emptyMessage={t('inventory.noItems')}
                rowClassName={(item) => {
                  const qty = item.current_quantity;
                  const min = item.minimum_quantity;
                  if (qty == null || qty <= 0) return 'bg-red-100 dark:bg-red-900/60';
                  if (min != null && qty < min) return 'bg-purple-100 dark:bg-fuchsia-900/50';
                  return '';
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
