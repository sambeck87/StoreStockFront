import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input } from '../../components/common';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Store } from '../../types';
import { Building2, MapPin, Phone, User, Pencil, Save, X } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

export function StorePage() {
  const { t } = useTranslation();
  const { user, hasPermission } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canEdit = hasPermission('store', 'update');

  const fetchStore = async () => {
    if (!user?.store_id) {
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.getStore(user.store_id);
      setStore(data);
      setFormData({ name: data.name, address: data.address || '', phone: data.phone || '' });
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStore();
  }, [user?.store_id]);

  const handleEdit = () => {
    setErrors({});
    setIsEditing(true);
  };

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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!store) return;

    setSaving(true);
    try {
      const updated = await api.updateStore(store.id, formData);
      setStore(updated);
      setIsEditing(false);
    } catch (error) {
      const message = api.getErrorMessage(error);
      alert(message);
      console.error('Error updating store:', error);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        {t('store.noStoreAssigned')}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('store.title')}</h1>
        {!isEditing && canEdit && (
          <Button onClick={handleEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            {t('common.edit')}
          </Button>
        )}
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                label={t('store.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={errors.name}
                required
              />
              <Input
                label={t('store.address')}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
              <Input
                label={t('store.phone')}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {t('common.save')}
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2" />
                  {t('common.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('store.name')}</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{store.name}</p>
                </div>
              </div>
              {store.manager_name && (
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('store.manager')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{store.manager_name}</p>
                  </div>
                </div>
              )}
              {store.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('store.address')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{store.address}</p>
                  </div>
                </div>
              )}
              {store.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('store.phone')}</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{store.phone}</p>
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
