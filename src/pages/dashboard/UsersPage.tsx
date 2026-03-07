import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Table, Modal, Input } from '../../components/common';
import { api } from '../../api';
import type { User } from '../../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { validateForm, validationMessages } from '../../utils/validation';

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (user?: User) => {
    setErrors({});
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.full_name, email: user.email, password: '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', password: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editingUser) {
      const validationErrors = validateForm(formData, [
        { field: 'name', rules: { required: validationMessages.nameRequired } },
      ]);
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    } else {
      const validationErrors = validateForm(formData, [
        { field: 'name', rules: { required: validationMessages.nameRequired } },
        { field: 'email', rules: { required: validationMessages.emailRequired } },
        { field: 'password', rules: { required: validationMessages.passwordMinLength } },
      ]);
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    try {
      const data = editingUser
        ? { full_name: formData.name }
        : { email: formData.email, password: formData.password, full_name: formData.name };
      
      if (editingUser) {
        await api.updateUser(editingUser.id, data);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      const message = api.getErrorMessage(error);
      alert(message);
      console.error('Error saving user:', error);
    }
  };

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

  const columns = [
    { key: 'full_name', header: t('users.name'), render: (u: User) => u.full_name },
    { key: 'email', header: t('users.email') },
    { key: 'role', header: t('users.role'), render: (u: User) => u.role?.name || '-' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (user: User) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(user)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
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
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          {t('users.create')}
        </Button>
      </div>
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <Table data={users} columns={columns} keyExtractor={(u) => u.id} emptyMessage={t('users.noUsers')} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? t('users.edit') : t('users.create')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit}>{t('common.save')}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t('users.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            required
          />
          {!editingUser && (
            <>
              <Input
                label={t('users.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={errors.email}
                required
              />
              <Input
                label={t('auth.password')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={errors.password}
                required
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
