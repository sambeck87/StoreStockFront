import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Skeleton, EmptyState } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Store } from '../../types';
import { Building2, MapPin, Phone, User, Pencil, Save, X, Loader2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';
import { toast } from 'react-toastify';

export function StorePage() {
  const { t } = useTranslation();
  const { user, hasPermission, permissionResources } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('store', 'update');
  const canViewStore = (permissionResources['store']?.length ?? 0) > 0;

  const fetchStore = async () => {
    try {
      setError('');
      if (user?.store_id) {
        const data = await api.getStore(user.store_id);
        setStore(data);
        setFormData({ name: data.name, address: data.address || '', phone: data.phone || '' });
      } else if (canViewStore) {
        const stores = await api.getStores();
        if (stores.length > 0) {
          setStore(stores[0]);
          setFormData({ name: stores[0].name, address: stores[0].address || '', phone: stores[0].phone || '' });
        }
      }
    } catch (err) {
      const message = api.getErrorMessage(err);
      setError(message);
      console.error('Error fetching store:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStore(); }, [user?.store_id]);

  const handleEdit = () => { setErrors({}); setIsEditing(true); };
  const handleCancel = () => {
    if (!store) return;
    setFormData({ name: store.name, address: store.address || '', phone: store.phone || '' });
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const validationErrors = validateForm(formData, [
      { field: 'name', rules: { required: validationMessages.nameRequired } },
    ]);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    if (!store) return;
    setSaving(true);
    try {
      const updated = await api.updateStore(store.id, formData);
      setStore(updated);
      setIsEditing(false);
    } catch (err) {
      const message = api.getErrorMessage(err);
      toast.error(message);
      console.error('Error updating store:', err);
    } finally { setSaving(false); }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton variant="text" width={160} height={24} className="mb-6" />
        <Card>
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <Skeleton variant="circular" width={48} height={48} />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="text" width="30%" />
              </div>
            </div>
            <div className="space-y-3">
              <Skeleton variant="text" height={14} />
              <Skeleton variant="text" height={14} />
              <Skeleton variant="text" height={14} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!store) {
    return error ? (
      <div className="text-center py-12"><p className="text-sm text-red-500">{error}</p></div>
    ) : (
      <EmptyState icon={<Building2 className="w-8 h-8" />} title={t('store.noStoreAssigned')} />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('store.title')}</h1>
        {!isEditing && canEdit && (
          <Button onClick={handleEdit} size="sm">
            <Pencil className="w-4 h-4" />
            {t('common.edit')}
          </Button>
        )}
      </div>

      <Card>
        <div className="p-5 space-y-5">
          {isEditing ? (
            <div className="space-y-4">
              <Input label={t('store.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} required />
              <Input label={t('store.address')} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              <Input label={t('store.phone')} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} size="sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {t('common.save')}
                </Button>
                <Button variant="secondary" onClick={handleCancel} size="sm">
                  <X className="w-4 h-4" />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[var(--color-accent)]" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('store.name')}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.name}</p>
                </div>
              </div>
              {store.manager_name && (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('store.manager')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.manager_name}</p>
                  </div>
                </div>
              )}
              {store.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('store.address')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.address}</p>
                  </div>
                </div>
              )}
              {store.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[var(--color-accent)]" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('store.phone')}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{store.phone}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default StorePage;
