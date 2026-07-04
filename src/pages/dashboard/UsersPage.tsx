import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Skeleton, SkeletonTable } from '../../components/common';
import { api } from '../../api';
import type { User, Branch } from '../../types';
import { Trash2, Power, UserMinus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, permissionResources } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [branchesWithPermission, setBranchesWithPermission] = useState<Branch[]>([]);

  const hasGlobalUserPermission = (permissionResources['user']?.length ?? 0) > 0;

  useEffect(() => {
    const branchesWithUserPerm = user?.branches?.filter(branch => branch.role?.id) || [];
    setBranchesWithPermission(branchesWithUserPerm);
    if (hasGlobalUserPermission) {
      setSelectedBranchId(null);
    } else if (branchesWithUserPerm.length > 0) {
      setSelectedBranchId(branchesWithUserPerm[0].id);
    }
  }, [user, hasGlobalUserPermission]);

  const fetchUsers = async () => {
    try {
      let data: User[];
      if (selectedBranchId === null && hasGlobalUserPermission) {
        data = await api.getUsers();
      } else if (selectedBranchId) {
        data = await api.getBranchUsers(selectedBranchId);
      } else {
        data = [];
      }
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasGlobalUserPermission || selectedBranchId) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [hasGlobalUserPermission, selectedBranchId]);

  const handleDelete = async (id: number) => {
    if (window.confirm(t('users.confirmDelete'))) {
      try { await api.deleteUser(id); fetchUsers(); }
      catch (error) { const message = api.getErrorMessage(error); toast.error(message); console.error('Error deleting user:', error); }
    }
  };

  const handleToggleStatus = async (u: User) => {
    try { await api.manageUser(u.id, { active: !u.active }); fetchUsers(); }
    catch (error) { const message = api.getErrorMessage(error); toast.error(message); console.error('Error toggling status:', error); }
  };

  const handleDetachStore = async (id: number) => {
    if (window.confirm('¿Estás seguro de desacoplar a este usuario de la tienda? No podrá acceder a ninguna sucursal.')) {
      try { await api.detachUserStore(id); fetchUsers(); }
      catch(error) { const message = api.getErrorMessage(error); toast.error(message); console.error('Error detaching user from store:', error); }
    }
  };

  const columns = [
    { key: 'full_name', header: t('users.name'), render: (u: User) => <span className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</span> },
    { key: 'email', header: t('users.email'), render: (u: User) => <span className="text-gray-500 dark:text-gray-400">{u.email}</span> },
    { key: 'branches', header: 'Sucursales', render: (u: User) => <span className="text-gray-500 dark:text-gray-400">{u.branches?.map(b => b.name).join(', ') || '-'}</span> },
    {
      key: 'actions',
      header: '',
      render: (u: User) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleToggleStatus(u)}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
              u.active
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                : 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            <Power className="w-3 h-3" />
            {u.active ? 'Activo' : 'Inactivo'}
          </button>
          <Button variant="ghost" size="sm" onClick={() => handleDetachStore(u.id)} className="text-orange-500 hover:text-orange-600"><UserMinus className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('users.title')}</h1>
      </div>

      {(hasGlobalUserPermission || branchesWithPermission.length > 0) && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-[var(--color-border)] dark:border-gray-800">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Sucursal:</span>
          <select value={selectedBranchId ?? 'all'} onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-2.5 py-1.5 text-xs border border-[var(--color-border)] dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] outline-none">
            {hasGlobalUserPermission && <option value="all">Todos</option>}
            {branchesWithPermission.map(branch => (<option key={branch.id} value={branch.id}>{branch.name}</option>))}
          </select>
        </div>
      )}

      <Card>
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)] dark:divide-gray-800">
            <div className="flex gap-4 px-5 py-4 border-b border-[var(--color-border)] dark:border-gray-800">
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" className="flex-1" height={14} />
              <Skeleton variant="text" width={80} height={14} />
            </div>
            <SkeletonTable rows={4} cols={3} />
          </div>
        ) : (
          <Table data={users} columns={columns} keyExtractor={(u) => u.id} emptyMessage={t('users.noUsers')} onRowClick={(u) => navigate(`/users/${u.id}`)} />
        )}
      </Card>
    </div>
  );
}

export default UsersPage;
