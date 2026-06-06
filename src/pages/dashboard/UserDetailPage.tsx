import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Modal, Table } from '../../components/common';
import { api } from '../../api';
import type { User, Branch, Role, GlobalPermission } from '../../types';
import { ArrowLeft, Plus, Pencil, Trash2, Save } from 'lucide-react';

export function UserDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [globalPermissions, setGlobalPermissions] = useState<GlobalPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [globalPermId, setGlobalPermId] = useState<string>('');

  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<{ id: number; role_id: number } | null>(null);
  const [formBranchId, setFormBranchId] = useState('');
  const [formRoleId, setFormRoleId] = useState('');

  const fetchUser = async () => {
    if (!id) return;
    try {
      const data = await api.getUser(Number(id));
      setUser(data);
      setGlobalPermId(data.global_permission?.id ? String(data.global_permission.id) : '');
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, rolesData, permsData] = await Promise.all([
          api.getBranches(),
          api.getRoles(),
          api.getGlobalPermissions(),
        ]);
        setBranches(branchesData);
        setRoles(rolesData);
        setGlobalPermissions(permsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
    fetchUser().finally(() => setIsLoading(false));
  }, [id]);

  const handleUpdateGlobalPermission = async () => {
    if (!user) return;
    try {
      await api.manageUser(user.id, { global_permission_id: globalPermId ? Number(globalPermId) : null });
      fetchUser();
      alert('Permisos globales actualizados');
    } catch (error) {
      const msg = api.getErrorMessage(error);
      alert(msg);
    }
  };

  const handleManageBranch = async () => {
    if (!user || !formBranchId || !formRoleId) {
      alert('Sucursal y Rol son requeridos');
      return;
    }
    try {
      await api.manageUser(user.id, { branch_id: Number(formBranchId), role_id: Number(formRoleId) });
      setIsBranchModalOpen(false);
      fetchUser();
    } catch (error) {
      const msg = api.getErrorMessage(error);
      alert(msg);
    }
  };

  const handleRemoveBranch = async (branchId: number) => {
    if (window.confirm('¿Seguro que deseas remover el acceso a esta sucursal?')) {
      if (!user) return;
      try {
        await api.revokeUserBranchAccess(user.id, branchId);
        fetchUser();
      } catch (error) {
        const msg = api.getErrorMessage(error);
        alert(msg);
      }
    }
  };

  const openBranchModal = (branchItem?: Record<string, any>) => {
    if (branchItem) {
      setEditingBranch({ id: branchItem.id, role_id: branchItem.role?.id || 0 });
      setFormBranchId(String(branchItem.id));
      setFormRoleId(String(branchItem.role?.id || ''));
    } else {
      setEditingBranch(null);
      setFormBranchId('');
      setFormRoleId('');
    }
    setIsBranchModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Sucursal', render: (b: any) => <span className="font-medium text-gray-900 dark:text-gray-100">{b.name}</span> },
    { key: 'role', header: 'Rol', render: (b: any) => <span className="text-gray-600 dark:text-gray-400">{b.role?.name || '-'}</span> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (b: any) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => openBranchModal(b)} title="Editar rol">
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleRemoveBranch(b.id)} title="Remover acceso">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <div className="text-center py-12 text-gray-500 dark:text-gray-400">Usuario no encontrado</div>;
  }

  const existingBranchIds = new Set(user.branches?.map(b => b.id) || []);
  const availableBranches = branches.filter(b => editingBranch || !existingBranchIds.has(b.id));

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h1>
        <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branches list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Sucursales y Roles</h2>
            <Button size="sm" onClick={() => openBranchModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Asociar Sucursal
            </Button>
          </div>
          
          <div className="hidden md:block">
            <Card className="p-0 overflow-hidden">
              <Table 
                data={user.branches || []} 
                columns={columns} 
                keyExtractor={(b: any) => b.id} 
                emptyMessage="Sin sucursales asignadas"
              />
            </Card>
          </div>
          
          <div className="md:hidden space-y-4">
            {(user.branches || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">Sin sucursales asignadas</div>
            ) : (
              (user.branches || []).map((b: any) => (
                <Card key={b.id}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{b.name}</h3>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                      {b.role?.name || '-'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="secondary" size="sm" onClick={() => openBranchModal(b)} className="flex-1">
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBranch(b.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Global permissions */}
        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Permisología Global</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permiso Global
                </label>
                <select
                  value={globalPermId}
                  onChange={(e) => setGlobalPermId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">(Ninguno)</option>
                  {globalPermissions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleUpdateGlobalPermission} className="w-full justify-center">
                <Save className="w-4 h-4 mr-2" /> Guardar Permisos
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? 'Actualizar Rol en Sucursal' : 'Asociar a Sucursal'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsBranchModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleManageBranch}>Guardar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sucursal *
            </label>
            <select
              value={formBranchId}
              onChange={(e) => setFormBranchId(e.target.value)}
              disabled={!!editingBranch}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-50"
            >
              <option value="">Seleccione una sucursal</option>
              {availableBranches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rol *
            </label>
            <select
              value={formRoleId}
              onChange={(e) => setFormRoleId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">Seleccione un rol</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
