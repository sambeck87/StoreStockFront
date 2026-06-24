import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table } from '../../components/common';
import { api } from '../../api';
import type { User, Branch } from '../../types';
import { Trash2, Power, UserMinus, Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
      try {
        await api.deleteUser(id);
        fetchUsers();
      } catch (error) {
        const message = api.getErrorMessage(error);
        alert(message);
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await api.manageUser(user.id, { active: !user.active });
      fetchUsers();
    } catch (error) {
      const message = api.getErrorMessage(error);
      alert(message);
      console.error('Error toggling status:', error);
    }
  };

  const handleDetachStore = async (id: number) => {
    if (window.confirm('¿Estás seguro de desacoplar a este usuario de la tienda? No podrá acceder a ninguna sucursal.')) {
      try {
        await api.detachUserStore(id);
        fetchUsers();
      } catch(error) {
        const message = api.getErrorMessage(error);
        alert(message);
        console.error('Error detaching user from store:', error);
      }
    }
  };

  const columns = [
    { key: 'full_name', header: t('users.name'), render: (u: User) => <span className="font-medium text-gray-900 dark:text-gray-100">{u.full_name}</span> },
    { key: 'email', header: t('users.email'), render: (u: User) => <span className="text-gray-600 dark:text-gray-400">{u.email}</span> },
    { key: 'branches', header: 'Sucursales', render: (u: User) => <span className="text-gray-600 dark:text-gray-400">{u.branches?.map(b => b.name).join(', ') || '-'}</span> },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (user: User) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleToggleStatus(user)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              user.active 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            title={user.active ? 'Desactivar' : 'Activar'}
          >
            <Power className="w-3 h-3" />
            {user.active ? 'Activo' : 'Inactivo'}
          </button>
          
          <Button variant="ghost" size="sm" onClick={() => handleDetachStore(user.id)} title="Desacoplar de tienda">
            <UserMinus className="w-4 h-4 text-orange-500" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} title="Eliminar usuario">
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('users.title')}</h1>
      </div>
      
      {(hasGlobalUserPermission || branchesWithPermission.length > 0) && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Sucursal:</span>
          <select
            value={selectedBranchId ?? 'all'}
            onChange={(e) => setSelectedBranchId(e.target.value === 'all' ? null : Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {hasGlobalUserPermission && <option value="all">Todos</option>}
            {branchesWithPermission.map(branch => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table data={users} columns={columns} keyExtractor={(u) => u.id} emptyMessage={t('users.noUsers')} onRowClick={(user) => navigate(`/users/${user.id}`)} />
        )}
      </Card>

    </div>
  );
}
