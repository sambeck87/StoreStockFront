import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Table } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Item, Branch, Category } from '../../types';
import { Filter, RotateCcw, Package } from 'lucide-react';

const QUANTITY_STATUS_OPTIONS = ['complete', 'low', 'empty'] as const;

export function InventoryPage() {
  const { t } = useTranslation();
  const { permissionResources } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const branchId = searchParams.get('branch_id') || '';
  const categoryId = searchParams.get('category_id') || '';
  const quantityStatus = searchParams.get('quantity_status') || '';
  const active = searchParams.get('active') || '';

  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
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

  const statusLabels: Record<string, string> = {
    complete: t('inventory.qtyComplete'),
    low: t('inventory.qtyLow'),
    empty: t('inventory.qtyEmpty'),
  };

  const columns = [
    ...(showBranchColumn
      ? [{ key: 'branch_name' as const, header: t('branches.title'), render: (item: Item) => item.branch_name || '-' }]
      : []),
    { key: 'name' as const, header: t('inventory.name') },
    {
      key: 'category_name' as const,
      header: t('inventory.category'),
      render: (item: Item) => item.category_name || '-',
    },
    { key: 'measure' as const, header: t('inventory.measure'), render: (item: Item) => item.measure || '-' },
    {
      key: 'current_quantity' as const,
      header: t('inventory.currentQuantity'),
      render: (item: Item) => (item.current_quantity != null ? item.current_quantity : '-'),
    },
    {
      key: 'minimum_quantity' as const,
      header: t('inventory.minimumQuantity'),
      render: (item: Item) => (item.minimum_quantity != null ? item.minimum_quantity : '-'),
    },
    {
      key: 'active' as const,
      header: t('inventory.status'),
      render: (item: Item) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {item.active ? t('inventory.active') : t('inventory.inactive')}
        </span>
      ),
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
          <Table data={items} columns={columns} keyExtractor={(item) => `${item.id}-${item.branch_id || 0}`} emptyMessage={t('inventory.noItems')} />
        )}
      </Card>
    </div>
  );
}
