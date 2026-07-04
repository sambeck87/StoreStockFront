import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Modal, Table, Skeleton, EmptyState } from '../../components/common';
import { api } from '../../api';
import type { User, Branch, Role, GlobalPermission } from '../../types';
import { ArrowLeft, Plus, Pencil, Trash2, Save, UserX, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';

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
    } catch (error) { console.error('Error fetching user:', error); }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchesData, rolesData, permsData] = await Promise.all([api.getBranches(), api.getRoles(), api.getGlobalPermissions()]);
        setBranches(branchesData); setRoles(rolesData); setGlobalPermissions(permsData);
      } catch (error) { console.error('Error fetching data:', error); }
    };
    fetchData();
    fetchUser().finally(() => setIsLoading(false));
  }, [id]);

  const handleUpdateGlobalPermission = async () => {
    if (!user) return;
    try {
      await api.manageUser(user.id, { global_permission_id: globalPermId ? Number(globalPermId) : null });
      fetchUser();
      toast.success('Permisos globales actualizados');
    } catch (error) { const msg = api.getErrorMessage(error); toast.error(msg); }
  };

  const handleManageBranch = async () => {
    if (!user || !formBranchId || !formRoleId) { toast.error('Sucursal y Rol son requeridos'); return; }
    try {
      await api.manageUser(user.id, { branch_id: Number(formBranchId), role_id: Number(formRoleId) });
      setIsBranchModalOpen(false);
      fetchUser();
    } catch (error) { const msg = api.getErrorMessage(error); toast.error(msg); }
  };

  const handleRemoveBranch = async (branchId: number) => {
    if (window.confirm('¿Seguro que deseas remover el acceso a esta sucursal?')) {
      if (!user) return;
      try { await api.revokeUserBranchAccess(user.id, branchId); fetchUser(); }
      catch (error) { const msg = api.getErrorMessage(error); toast.error(msg); }
    }
  };

  const openBranchModal = (branchItem?: Record<string, any>) => {
    if (branchItem) {
      setEditingBranch({ id: branchItem.id, role_id: branchItem.role?.id || 0 });
      setFormBranchId(String(branchItem.id));
      setFormRoleId(String(branchItem.role?.id || ''));
    } else {
      setEditingBranch(null);
      setFormBranchId(''); setFormRoleId('');
    }
    setIsBranchModalOpen(true);
  };

  const columns = [
    { key: 'name', header: 'Sucursal', render: (b: any) => <span className="font-medium text-gray-900 dark:text-gray-100">{b.name}</span> },
    { key: 'role', header: 'Rol', render: (b: any) => <span className="text-gray-500 dark:text-gray-400 text-xs">{b.role?.name || '-'}</span> },
    {
      key: 'actions', header: '',
      render: (b: any) => (
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" onClick={() => openBranchModal(b)}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleRemoveBranch(b.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ),
    },
  ];

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
              <Skeleton variant="text" height={14} />
            </div>
          </div>
        </Card>
      </div>
    );
  }
  if (!user) return <EmptyState icon={<UserX className="w-8 h-8" />} title="Usuario no encontrado" className="py-12" />;

  const existingBranchIds = new Set(user.branches?.map(b => b.id) || []);
  const availableBranches = branches.filter(b => editingBranch || !existingBranchIds.has(b.id));

  return (
    <div>
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        {t('common.back')}
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.full_name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Sucursales y Roles</h2>
            <Button size="sm" onClick={() => openBranchModal()}>
              <Plus className="w-4 h-4" />
              Asociar Sucursal
            </Button>
          </div>

          <div className="hidden md:block">
            <Table data={user.branches || []} columns={columns} keyExtractor={(b: any) => b.id} emptyMessage="Sin sucursales asignadas" />
          </div>

          <div className="md:hidden space-y-3">
            {(user.branches || []).length === 0 ? (
              <div><EmptyState icon={<Building2 className="w-6 h-6" />} title="Sin sucursales asignadas" className="py-8" /></div>
            ) : (
              (user.branches || []).map((b: any) => (
                <Card key={b.id}>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{b.name}</h3>
                    <span className="text-[10px] bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded border border-[var(--color-border)] dark:border-gray-700">{b.role?.name || '-'}</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-[var(--color-border)] dark:border-gray-800">
                    <Button variant="secondary" size="sm" onClick={() => openBranchModal(b)} className="flex-1"><Pencil className="w-3.5 h-3.5" /> Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveBranch(b.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Permisología Global</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Permiso Global</label>
                <select value={globalPermId} onChange={(e) => setGlobalPermId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
                  <option value="">(Ninguno)</option>
                  {globalPermissions.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>
              <Button onClick={handleUpdateGlobalPermission} className="w-full justify-center" size="sm">
                <Save className="w-4 h-4" /> Guardar Permisos
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        title={editingBranch ? 'Actualizar Rol en Sucursal' : 'Asociar a Sucursal'}
        footer={<><Button variant="secondary" onClick={() => setIsBranchModalOpen(false)}>Cancelar</Button><Button onClick={handleManageBranch}>Guardar</Button></>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sucursal *</label>
            <select value={formBranchId} onChange={(e) => setFormBranchId(e.target.value)} disabled={!!editingBranch}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 disabled:opacity-50 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
              <option value="">Seleccione una sucursal</option>
              {availableBranches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rol *</label>
            <select value={formRoleId} onChange={(e) => setFormRoleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
              <option value="">Seleccione un rol</option>
              {roles.map(r => (<option key={r.id} value={r.id}>{r.name}</option>))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default UserDetailPage;
