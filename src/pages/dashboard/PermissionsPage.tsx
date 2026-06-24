import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { api } from '../../api';
import type { Role, GlobalPermission } from '../../types';
import { Plus, Pencil, Trash2, Shield, ShieldCheck } from 'lucide-react';

const GLOBAL_ONLY_RESOURCES = ['role', 'permission', 'global_permission', 'store', 'branch', 'category'];

const PERMISSIONS_CONFIG: Record<string, { label: string; actions: Record<string, string> }> = {
  user: {
    label: 'Usuarios',
    actions: {
      index: 'Ver listado de usuarios',
      show: 'Ver detalles del usuario',
      create: 'Crear usuarios',
      update: 'Actualizar usuarios',
      delete: 'Eliminar usuarios',
      manage: 'Administrar usuarios',
      revoke_access: 'Revocar acceso a sucursales',
    },
  },
  store: {
    label: 'Tiendas',
    actions: {
      show: 'Ver detalles de la tienda',
      update: 'Actualizar tienda',
    },
  },
  branch: {
    label: 'Sucursales',
    actions: {
      index: 'Ver listado de sucursales',
      show: 'Ver detalles de la sucursal',
      create: 'Crear sucursales',
      update: 'Actualizar sucursales',
      delete: 'Eliminar sucursales',
    },
  },
  category: {
    label: 'Categorías',
    actions: {
      index: 'Ver listado de categorías',
      show: 'Ver detalles de la categoría',
      create: 'Crear categorías',
      update: 'Actualizar categorías',
      delete: 'Eliminar categorías',
    },
  },
  item: {
    label: 'Artículos',
    actions: {
      index: 'Ver listado de artículos',
      show: 'Ver detalles del artículo',
      create: 'Crear artículos',
      update: 'Actualizar artículos',
      delete: 'Eliminar artículos',
    },
  },
  role: {
    label: 'Roles',
    actions: {
      index: 'Ver listado de roles',
      show: 'Ver detalles del rol',
      create: 'Crear roles',
      update: 'Actualizar roles',
      delete: 'Eliminar roles',
    },
  },
  global_permission: {
    label: 'Permisos Globales',
    actions: {
      index: 'Ver listado de permisos globales',
      show: 'Ver detalles del permiso global',
      create: 'Crear permisos globales',
      update: 'Actualizar permisos globales',
      delete: 'Eliminar permisos globales',
    },
  },
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getAvailableResources = (): typeof PERMISSIONS_CONFIG => {
    if (activeTab === 'roles') {
      return Object.entries(PERMISSIONS_CONFIG)
        .filter(([key]) => !GLOBAL_ONLY_RESOURCES.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as typeof PERMISSIONS_CONFIG);
    }
    return PERMISSIONS_CONFIG;
  };

  const handleOpenModal = async (item?: Role | GlobalPermission) => {
    if (item) {
      setEditingItem(item);
      setIsLoadingItem(true);
      
      try {
        let freshItem: Role | GlobalPermission;
        if (activeTab === 'roles') {
          freshItem = await api.getRole(item.id);
        } else {
          freshItem = await api.getGlobalPermission(item.id);
        }
        
        const itemPermissions = freshItem.permissions || {};
        const permissionsObj: Record<string, string[]> = {};
        Object.keys(PERMISSIONS_CONFIG).forEach(key => {
          const permValue = itemPermissions[key];
          if (Array.isArray(permValue)) {
            permissionsObj[key] = permValue;
          } else {
            permissionsObj[key] = [];
          }
        });
        
        setFormData({
          name: freshItem.name,
          permissions: permissionsObj,
        });
      } catch (err) {
        console.error('Error fetching item:', err);
      } finally {
        setIsLoadingItem(false);
      }
    } else {
      setEditingItem(null);
      const defaultPermissions: Record<string, string[]> = {};
      Object.keys(PERMISSIONS_CONFIG).forEach(key => {
        defaultPermissions[key] = [];
      });
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
        newPermissions = currentPermissions.includes(action)
          ? currentPermissions
          : [...currentPermissions, action];
        if (WRITE_ACTIONS.includes(action)) {
          READ_ACTIONS.forEach(readAction => {
            if (!newPermissions.includes(readAction)) {
              newPermissions.push(readAction);
            }
          });
        }
      } else {
        newPermissions = currentPermissions.filter(p => p !== action);
        if (READ_ACTIONS.includes(action)) {
          newPermissions = newPermissions.filter(p => !WRITE_ACTIONS.includes(p));
        }
      }

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [resource]: newPermissions,
        },
      };
    });
  };

  const handleSelectAllResource = (resource: string, allActions: string[], checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [resource]: checked ? [...allActions] : [],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert('El nombre es requerido');
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        permissions: formData.permissions,
      };
      
      if (editingItem) {
        if (activeTab === 'roles') {
          await api.updateRole(editingItem.id, itemData);
        } else {
          await api.updateGlobalPermission(editingItem.id, itemData);
        }
      } else {
        if (activeTab === 'roles') {
          await api.createRole(itemData);
        } else {
          await api.createGlobalPermission(itemData);
        }
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      const message = api.getErrorMessage(err);
      alert(message);
      console.error('Error saving:', err);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmMessage = activeTab === 'roles' 
      ? t('permissions.confirmDeleteRole') 
      : t('permissions.confirmDeletePermission');
    
    if (window.confirm(confirmMessage)) {
      try {
        if (activeTab === 'roles') {
          await api.deleteRole(id);
        } else {
          await api.deleteGlobalPermission(id);
        }
        fetchData();
      } catch (err) {
        const message = api.getErrorMessage(err);
        alert(message);
        console.error('Error deleting:', err);
      }
    }
  };

  const roleColumns = [
    { key: 'name', header: t('permissions.name') },
    { 
      key: 'permissions', 
      header: t('permissions.permissions'), 
      render: (role: Role) => {
        const perms = role.permissions || {};
        const count = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
        return count > 0 ? `${count} ${t('permissions.assigned')}` : t('permissions.none');
      }
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (role: Role) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(role)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(role.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const permissionColumns = [
    { key: 'name', header: t('permissions.name') },
    { 
      key: 'permissions', 
      header: t('permissions.permissions'), 
      render: (perm: GlobalPermission) => {
        const perms = perm.permissions || {};
        const count = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
        return count > 0 ? `${count} ${t('permissions.assigned')}` : t('permissions.none');
      }
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (perm: GlobalPermission) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(perm)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(perm.id)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
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
        <div key={resource} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {config.label}
            </h4>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAllResource(resource, allActions, e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600 dark:text-gray-400 text-xs">
                {allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </span>
            </label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(config.actions).map(([action, label]) => (
              <label key={action} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.permissions[resource]?.includes(action) || false}
                  onChange={(e) => handlePermissionChange(resource, action, e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                />
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('permissions.title')}</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('permissions.create')}
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('roles')}
            className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t('permissions.roles')}
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors ${
              activeTab === 'permissions'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {t('permissions.globalPermissions')}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </div>
      ) : (
        <>
          <div className="hidden lg:block">
            <Table data={data} columns={columns} keyExtractor={(item) => item.id} emptyMessage={emptyMessage} />
          </div>

          <div className="lg:hidden space-y-4">
            {data.map((item) => {
              const perms = item.permissions || {};
              const permCount = Object.values(perms).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
              const isRole = activeTab === 'roles';
              
              return (
                <Card key={item.id}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permCount > 0 ? `${permCount} ${t('permissions.assigned')}` : t('permissions.none')}
                      </p>
                    </div>
                    {isRole ? (
                      <Shield className="w-5 h-5 text-blue-500" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    )}
                  </div>

                  {permCount > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(perms).flatMap(([resource, actions]) => 
                        (actions as string[]).map(action => (
                          <span key={`${resource}-${action}`} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded text-gray-600 dark:text-gray-300">
                            {resource}:{action}
                          </span>
                        ))
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
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
          </div>
        </>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? t('permissions.edit') : t('permissions.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isLoadingItem}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit} disabled={isLoadingItem}>{t('common.save')}</Button>
          </>
        }
      >
        {isLoadingItem ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label={t('permissions.name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('permissions.permissions')}
              </label>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {renderPermissionSection()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
