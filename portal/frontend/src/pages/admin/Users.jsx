import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Trash2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Table from '../../components/ui/Table.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import UserForm from '../../components/users/UserForm.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import useAuth from '../../hooks/useAuth.js';
import { listUsers, createUser, deleteUserPermanently } from '../../api/userApi.js';
import { ROLE_LABELS } from '../../constants/index.js';
import { formatDate } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const roleTones = { ADMIN: 'brand', STAFF: 'info', CLIENT: 'neutral' };

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listUsers, { initialFilters: { role: '', isActive: '' } });

  const create = async (payload) => {
    setIsSaving(true);
    try {
      await createUser(payload);
      toast.success('Account created');
      setIsCreateOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUserPermanently(deleteTarget._id);
      toast.success(`${deleteTarget.name} was permanently removed`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Person',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{row.name}</p>
            <p className="truncate text-xs text-ink-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (row) => <Badge tone={roleTones[row.role]}>{ROLE_LABELS[row.role]}</Badge> },
    { key: 'company', header: 'Company', render: (row) => row.company || '—' },
    { key: 'phone', header: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.isActive ? 'success' : 'neutral'} dot>
          {row.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    { key: 'lastLogin', header: 'Last seen', render: (row) => formatDate(row.lastLogin) },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        if (currentUser && currentUser._id === row._id) return null;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              onClick={() => setDeleteTarget(row)}
              aria-label={`Delete ${row.name}`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="People"
        description="Clients, staff and administrators with access to the portal."
        actions={
          <Button icon={UserPlus} onClick={() => setIsCreateOpen(true)}>
            Add person
          </Button>
        }
      />

      <Card>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email or company…"
          onReset={resetFilters}
          filters={[
            {
              key: 'role',
              value: filters.role,
              placeholder: 'Any role',
              options: Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
              onChange: (value) => updateFilter('role', value),
            },
            {
              key: 'isActive',
              value: filters.isActive,
              placeholder: 'Any status',
              options: [
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Deactivated' },
              ],
              onChange: (value) => updateFilter('isActive', value),
            },
          ]}
        />

        <DataState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          isEmpty={!items.length}
          skeleton={<TableSkeleton />}
          loadingLabel="Loading people…"
          emptyTitle="Nobody matches that"
          emptyDescription="Try a different search or clear the filters."
        >
          <Table columns={columns} rows={items} onRowClick={(row) => navigate(`/admin/users/${row._id}`)} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add a person" size="lg">
        <UserForm onSubmit={create} isSubmitting={isSaving} onCancel={() => setIsCreateOpen(false)} />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleRemoveUser}
        title={`Delete account for ${deleteTarget?.name}?`}
        description="Are you sure you want to permanently delete this user account? Their data and access will be removed."
        confirmLabel="Delete account"
        variant="danger"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
};

export default AdminUsers;
