import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Power, PowerOff, Trash2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Input from '../../components/ui/Input.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import DataState from '../../components/ui/DataState.jsx';
import UserForm from '../../components/users/UserForm.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getUser, updateUser, deactivateUser, deleteUserPermanently } from '../../api/userApi.js';
import { ROLE_LABELS } from '../../constants/index.js';
import { formatDateTime } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const roleTones = { ADMIN: 'brand', STAFF: 'info', CLIENT: 'neutral' };

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetcher = useCallback(() => getUser(id), [id]);
  const { data, isLoading, error, refetch } = useFetch(fetcher, [id]);
  const person = data?.data;

  const save = async (payload) => {
    setIsSaving(true);
    try {
      await updateUser(id, payload);
      toast.success('Account updated');
      setIsEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async () => {
    setIsSaving(true);
    try {
      if (person.isActive) {
        await deactivateUser(id);
        toast.success('Account deactivated');
      } else {
        await updateUser(id, { isActive: true });
        toast.success('Account reactivated');
      }
      setIsConfirmOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeleteConfirmText('');
  };

  const remove = async () => {
    if (!canConfirmDelete) {
      toast.error('Type the exact email address to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteUserPermanently(id);
      toast.success(`${person.name} was permanently removed`);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
      closeDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const isSelf = person && currentUser && person._id === currentUser._id;
  const canConfirmDelete = person && deleteConfirmText.trim().toLowerCase() === person.email.toLowerCase();

  return (
    <PageContainer>
      <PageHeader
        title={person?.name || 'Person'}
        description={person?.email}
        backTo="/admin/users"
        backLabel="All people"
        actions={
          person && (
            <>
              <Button variant="secondary" icon={Pencil} onClick={() => setIsEditOpen(true)}>
                Edit
              </Button>
              {!isSelf && (
                <>
                  <Button
                    variant={person.isActive ? 'ghost' : 'secondary'}
                    icon={person.isActive ? PowerOff : Power}
                    onClick={() => setIsConfirmOpen(true)}
                  >
                    {person.isActive ? 'Deactivate' : 'Reactivate'}
                  </Button>
                  <Button variant="danger" icon={Trash2} onClick={() => setIsDeleteOpen(true)}>
                    Delete
                  </Button>
                </>
              )}
            </>
          )
        }
      />

      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading account…">
        {person && (
          <Card>
            <CardHeader
              title="Account details"
              action={
                <div className="flex gap-2">
                  <Badge tone={roleTones[person.role]}>{ROLE_LABELS[person.role]}</Badge>
                  <Badge tone={person.isActive ? 'success' : 'neutral'} dot>
                    {person.isActive ? 'Active' : 'Deactivated'}
                  </Badge>
                </div>
              }
            />
            <CardBody>
              <div className="flex items-center gap-4">
                <Avatar name={person.name} src={person.avatar} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink-900">{person.name}</p>
                  <p className="truncate text-sm text-ink-500">{person.email}</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs text-ink-500">Company</dt>
                  <dd className="text-sm font-medium text-ink-800">{person.company || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Phone</dt>
                  <dd className="text-sm font-medium text-ink-800">{person.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Joined</dt>
                  <dd className="text-sm font-medium text-ink-800">{formatDateTime(person.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Last sign in</dt>
                  <dd className="text-sm font-medium text-ink-800">{formatDateTime(person.lastLogin)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>
        )}
      </DataState>

      {person && (
        <>
          <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit ${person.name}`} size="lg">
            <UserForm
              mode="edit"
              defaultValues={{
                name: person.name,
                email: person.email,
                role: person.role,
                phone: person.phone || '',
                company: person.company || '',
                password: '',
              }}
              onSubmit={save}
              isSubmitting={isSaving}
              onCancel={() => setIsEditOpen(false)}
            />
          </Modal>

          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={toggleActive}
            isLoading={isSaving}
            variant={person.isActive ? 'danger' : 'primary'}
            title={person.isActive ? 'Deactivate this account?' : 'Reactivate this account?'}
            description={
              person.isActive
                ? 'They will be signed out and blocked from signing in again until reactivated. This can be undone at any time.'
                : 'They will be able to sign in again straight away.'
            }
            confirmLabel={person.isActive ? 'Deactivate' : 'Reactivate'}
          />

          <ConfirmDialog
            isOpen={isDeleteOpen}
            onClose={closeDelete}
            onConfirm={remove}
            isLoading={isDeleting}
            variant="danger"
            title={`Permanently delete ${person.name}?`}
            description="This removes the account completely — it will disappear from every list and cannot be recovered. Allowed only when this person has no request or project history; otherwise, deactivate them instead."
            confirmLabel="Delete permanently"
          >
            <Input
              label={`Type "${person.email}" to confirm`}
              value={deleteConfirmText}
              onChange={(event) => setDeleteConfirmText(event.target.value)}
              autoComplete="off"
            />
          </ConfirmDialog>
        </>
      )}
    </PageContainer>
  );
};

export default AdminUserDetail;

