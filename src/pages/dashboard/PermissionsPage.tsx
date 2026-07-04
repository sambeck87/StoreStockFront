import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input, Skeleton, SkeletonTable, EmptyState } from '../../components/common';
import { api } from '../../api';
import type { Role, GlobalPermission } from '../../types';
import { Plus, Pencil, Trash2, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const GLOBAL_ONLY_RESOURCES = ['role', 'permission', 'global_permission', 'store', 'branch', 'category'];

const PERMISSIONS_CONFIG: Record<string, { label: string; actions: Record<string, string> }> = {
  user: { label: 'Usuarios', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar', manage: 'Administrar', revoke_access: 'Revocar acceso' } },
  store: { label: 'Tiendas', actions: { show: 'Ver detalles', update: 'Actualizar' } },
  branch: { label: 'Sucursales', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar' } },
  category: { label: 'Categorías', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar' } },
  item: { label: 'Artículos', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar' } },
  role: { label: 'Roles', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar' } },
  global_permission: { label: 'Permisos Globales', actions: { index: 'Ver listado', show: 'Ver detalles', create: 'Crear', update: 'Actualizar', delete: 'Eliminar' } },
};

type TabType = 'roles' | 'permissions';

export function PermissionsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<GlobalPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Role | GlobalPermission | null>(null);
  const [formData, setFormData] = useState({ name: '', permissions: {} as Record<string, string[]> });

  const fetchData = async () => {
    try {
      setError('');
      setIsLoading(true);
      if (activeTab === 'roles') {
        const data = await api.getRoles();
        setRoles(data.filter(r => r.name !== 'super_admin'));
      } else {
        const data = await api.getGlobalPermissions();
        setPermissions(data);
      }
    } catch (err) {
      const message = api.getErrorMessage(err);
      setError(message);
      console.error('Error fetching data:', err);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const getAvailableResources = () => {
    if (activeTab === 'roles') {
      return Object.entries(PERMISSIONS_CONFIG).filter(([key]) => !GLOBAL_ONLY_RESOURCES.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as typeof PERMISSIONS_CONFIG);
    }
    return PERMISSIONS_CONFIG;
  };

  const handleOpenModal = async (item?: Role | GlobalPermission) => {
    if (item) {
      setEditingItem(item);
      setIsLoadingItem(true);
      try {
        const freshItem = activeTab === 'roles' ? await api.getRole(item.id) : await api.getGlobalPermission(item.id);
        const itemPermissions = freshItem.permissions || {};
        const permissionsObj: Record<string, string[]> = {};
        Object.keys(PERMISSIONS_CONFIG).forEach(key => {
          const permValue = itemPermissions[key];
          permissionsObj[key] = Array.isArray(permValue) ? permValue : [];
        });
        setFormData({ name: freshItem.name, permissions: permissionsObj });
      } catch (err) { console.error('Error fetching item:', err); }
      finally { setIsLoadingItem(false); }
    } else {
      setEditingItem(null);
      const defaultPermissions: Record<string, string[]> = {};
      Object.keys(PERMISSIONS_CONFIG).forEach(key => { defaultPermissions[key] = []; });
      setFormData({ name: '', permissions: defaultPermissions });
    }
    setIsModalOpen(true);
  };

  const READ_ACTIONS = ['index', 'show'];
  const WRITE_ACTIONS = ['create', 'update', 'delete'];

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    setFormData(prev => {
      const currentPermissions = prev.permissions[resource] || [];
      let newPermissions: string[];
      if (checked) {
        newPermissions = currentPermissions.includes(action) ? currentPermissions : [...currentPermissions, action];
        if (WRITE_ACTIONS.includes(action)) {
          READ_ACTIONS.forEach(readAction => { if (!newPermissions.includes(readAction)) newPermissions.push(readAction); });
        }
      } else {
        newPermissions = currentPermissions.filter(p => p !== action);
        if (READ_ACTIONS.includes(action)) newPermissions = newPermissions.filter(p => !WRITE_ACTIONS.includes(p));
      }
      return { ...prev, permissions: { ...prev.permissions, [resource]: newPermissions } };
    });
  };

  const handleSelectAllResource = (resource: string, allActions: string[], checked: boolean) => {
    setFormData(prev => ({ ...prev, permissions: { ...prev.permissions, [resource]: checked ? [...allActions] : [] } }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('El nombre es requerido'); return; }
    try {
      const itemData = { name: formData.name, permissions: formData.permissions };
      if (editingItem) {
        if (activeTab === 'roles') { await api.updateRole(editingItem.id, itemData); } else { await api.updateGlobalPermission(editingItem.id, itemData); }
      } else {
        if (activeTab === 'roles') { await api.createRole(itemData); } else { await api.createGlobalPermission(itemData); }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error saving:', err); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(activeTab === 'roles' ? t('permissions.confirmDeleteRole') : t('permissions.confirmDeletePermission'))) {
      try {
        if (activeTab === 'roles') { await api.deleteRole(id); } else { await api.deleteGlobalPermission(id); }
        fetchData();
      } catch (err) { const message = api.getErrorMessage(err); toast.error(message); console.error('Error deleting:', err); }
    }
  };

  const roleColumns = [
    { key: 'name', header: t('permissions.name') },
    { key: 'permissions', header: t('permissions.permissions'), render: (role: Role) => { const perms = role.permissions || {}; const count = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0); return <span className="text-xs text-gray-500">{count > 0 ? `${count} ${t('permissions.assigned')}` : t('permissions.none')}</span>; } },
    { key: 'actions', header: '', render: (role: Role) => (<div className="flex gap-1 justify-end"><Button variant="ghost" size="sm" onClick={() => handleOpenModal(role)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></div>) },
  ];

  const permissionColumns = [
    { key: 'name', header: t('permissions.name') },
    { key: 'permissions', header: t('permissions.permissions'), render: (perm: GlobalPermission) => { const perms = perm.permissions || {}; const count = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0); return <span className="text-xs text-gray-500">{count > 0 ? `${count} ${t('permissions.assigned')}` : t('permissions.none')}</span>; } },
    { key: 'actions', header: '', render: (perm: GlobalPermission) => (<div className="flex gap-1 justify-end"><Button variant="ghost" size="sm" onClick={() => handleOpenModal(perm)}><Pencil className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="sm" onClick={() => handleDelete(perm.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></div>) },
  ];

  const data = activeTab === 'roles' ? roles : permissions;
  const columns = activeTab === 'roles' ? roleColumns : permissionColumns;
  const emptyMessage = activeTab === 'roles' ? t('permissions.noRoles') : t('permissions.noPermissions');

  const renderPermissionSection = () => {
    const availableResources = getAvailableResources();
    return Object.entries(availableResources).map(([resource, config]) => {
      const allActions = Object.keys(config.actions);
      const selectedCount = formData.permissions[resource]?.length || 0;
      const allSelected = selectedCount === allActions.length;
      return (
        <div key={resource} className="border border-[var(--color-border)] dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{config.label}</h4>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={(e) => handleSelectAllResource(resource, allActions, e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
              <span className="text-gray-500">{allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}</span>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(config.actions).map(([action, label]) => (
              <label key={action} className="flex items-center gap-1.5 text-xs cursor-pointer py-0.5">
                <input type="checkbox" checked={formData.permissions[resource]?.includes(action) || false}
                  onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                <span className="text-gray-700 dark:text-gray-300">{label}</span>
              </label>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('permissions.title')}</h1>
        <Button onClick={() => handleOpenModal()} size="sm">
          <Plus className="w-4 h-4" />
          {t('permissions.create')}
        </Button>
      </div>

      <div className="mb-4">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg w-fit border border-[var(--color-border)] dark:border-gray-800">
          <button onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'roles' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <Shield className="w-3.5 h-3.5" />
            {t('permissions.roles')}
          </button>
          <button onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'permissions' ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
            {t('permissions.globalPermissions')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">{error}</div>
      )}

      {isLoading ? (
        <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
          <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
            <Skeleton variant="text" className="flex-1" height={14} />
            <Skeleton variant="text" className="flex-1" height={14} />
            <Skeleton variant="text" width={80} height={14} />
          </div>
          <SkeletonTable rows={4} cols={3} />
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={activeTab === 'roles' ? <Shield className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />} title={emptyMessage} />
      ) : (
        <>
          <div className="hidden lg:block">
            <Table data={data} columns={columns} keyExtractor={(item) => item.id} emptyMessage={emptyMessage} />
          </div>
          <div className="lg:hidden space-y-3">
            {data.map((item) => {
              const perms = item.permissions || {};
              const permCount = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
              const isRole = activeTab === 'roles';
              return (
                <Card key={item.id} className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <p className="text-xs text-gray-500">{permCount > 0 ? `${permCount} ${t('permissions.assigned')}` : t('permissions.none')}</p>
                    </div>
                    {isRole ? <Shield className="w-4 h-4 text-[var(--color-accent)]" /> : <ShieldCheck className="w-4 h-4 text-[var(--color-accent)]" />}
                  </div>
                  {permCount > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(perms).flatMap(([resource, actions]) =>
                        (actions as string[]).map(action => (
                          <span key={`${resource}-${action}`} className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 text-[10px] rounded text-gray-600 dark:text-gray-400 border border-[var(--color-border)] dark:border-gray-700">
                            {resource}:{action}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-3 border-t border-[var(--color-border)] dark:border-gray-800">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenModal(item)} className="flex-1"><Pencil className="w-3.5 h-3.5" />Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('permissions.edit') : t('permissions.create')}
        footer={
          <><Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isLoadingItem}>{t('common.cancel')}</Button><Button onClick={handleSubmit} disabled={isLoadingItem}>{t('common.save')}</Button></>
        }
        size="lg"
      >
        {isLoadingItem ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" /></div>
        ) : (
          <div className="space-y-4">
            <Input label={t('permissions.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('permissions.permissions')}</label>
              <div className="space-y-3 max-h-96 overflow-y-auto">{renderPermissionSection()}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PermissionsPage;
