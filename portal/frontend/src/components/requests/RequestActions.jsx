import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, Eye, StickyNote, FolderPlus } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Textarea from '../ui/Textarea.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import {
  addRequestNote,
  approveRequest,
  convertRequest,
  rejectRequest,
  reviewRequest,
} from '../../api/requestApi.js';
import { listUsers } from '../../api/userApi.js';
import { REQUEST_STATUS, ROLES } from '../../constants/index.js';
import { toDateInput } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

/** Admin-only review workflow for a single request. */
const RequestActions = ({ request, onChanged }) => {
  const navigate = useNavigate();
  const [dialog, setDialog] = useState(null);
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [staffOptions, setStaffOptions] = useState([]);
  const [convertValues, setConvertValues] = useState({ deadline: '', budget: '', staffId: '' });

  useEffect(() => {
    if (dialog !== 'convert') return;
    listUsers({ role: ROLES.STAFF, isActive: 'true', limit: 100 })
      .then((response) =>
        setStaffOptions(response.data.map((staff) => ({ value: staff._id, label: `${staff.name} · ${staff.email}` })))
      )
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [dialog]);

  useEffect(() => {
    if (dialog === 'convert') {
      setConvertValues({
        deadline: toDateInput(request.deadline),
        budget: request.budget ?? '',
        staffId: '',
      });
    }
  }, [dialog, request]);

  const close = () => {
    setDialog(null);
    setText('');
  };

  const run = async (action, { redirectTo } = {}) => {
    setIsSaving(true);
    try {
      const result = await action();
      close();
      if (redirectTo) navigate(redirectTo(result));
      else onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const { status } = request;
  const isOpen = [REQUEST_STATUS.NEW, REQUEST_STATUS.UNDER_REVIEW].includes(status);
  const actions = [];

  if (status === REQUEST_STATUS.NEW) {
    actions.push(
      <Button key="review" icon={Eye} onClick={() => setDialog('review')}>
        Start review
      </Button>
    );
  }

  if (isOpen) {
    actions.push(
      <Button key="approve" variant="success" icon={CheckCircle2} onClick={() => setDialog('approve')}>
        Approve
      </Button>,
      <Button key="reject" variant="danger" icon={XCircle} onClick={() => setDialog('reject')}>
        Reject
      </Button>
    );
  }

  if (status === REQUEST_STATUS.APPROVED) {
    actions.push(
      <Button key="convert" icon={FolderPlus} onClick={() => setDialog('convert')}>
        Convert to project
      </Button>
    );
  }

  if (status !== REQUEST_STATUS.REJECTED) {
    actions.push(
      <Button key="note" variant="ghost" icon={StickyNote} onClick={() => setDialog('note')}>
        Add note
      </Button>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">{actions}</div>

      <ConfirmDialog
        isOpen={dialog === 'review'}
        onClose={close}
        isLoading={isSaving}
        variant="primary"
        title="Move this request into review?"
        description="The client will see that someone is looking at it."
        confirmLabel="Start review"
        onConfirm={() => run(() => reviewRequest(request._id, { status: REQUEST_STATUS.UNDER_REVIEW }))}
      />

      <Modal
        isOpen={dialog === 'approve'}
        onClose={close}
        title="Approve this request"
        description="Approving does not create the project yet — you can convert it next."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={isSaving}
              onClick={() => run(() => approveRequest(request._id, { note: text.trim() || undefined }))}
            >
              Approve
            </Button>
          </>
        }
      >
        <Textarea label="Note (optional)" value={text} onChange={(event) => setText(event.target.value)} />
      </Modal>

      <Modal
        isOpen={dialog === 'reject'}
        onClose={close}
        title="Reject this request"
        description="The reason is shown to the client, so be specific."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={isSaving}
              disabled={text.trim().length < 5}
              onClick={() => run(() => rejectRequest(request._id, { reason: text.trim() }))}
            >
              Reject request
            </Button>
          </>
        }
      >
        <Textarea
          label="Why is this being rejected?"
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
          error={text && text.trim().length < 5 ? 'Give at least 5 characters of detail' : undefined}
        />
      </Modal>

      <Modal
        isOpen={dialog === 'note'}
        onClose={close}
        title="Add an internal note"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              isLoading={isSaving}
              disabled={!text.trim()}
              onClick={() => run(() => addRequestNote(request._id, { note: text.trim() }))}
            >
              Save note
            </Button>
          </>
        }
      >
        <Textarea label="Note" required value={text} onChange={(event) => setText(event.target.value)} />
      </Modal>

      <Modal
        isOpen={dialog === 'convert'}
        onClose={close}
        title="Convert to a project"
        description="Details are copied from the request. Adjust anything that has changed."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              isLoading={isSaving}
              onClick={() =>
                run(
                  () =>
                    convertRequest(request._id, {
                      deadline: convertValues.deadline || undefined,
                      budget: convertValues.budget === '' ? undefined : Number(convertValues.budget),
                      staffIds: convertValues.staffId ? [convertValues.staffId] : undefined,
                    }),
                  { redirectTo: (result) => `/admin/projects/${result.data._id}` }
                )
              }
            >
              Create project
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Deadline"
              type="date"
              value={convertValues.deadline}
              onChange={(event) => setConvertValues((v) => ({ ...v, deadline: event.target.value }))}
            />
            <Input
              label="Budget (USD)"
              type="number"
              min="0"
              step="50"
              value={convertValues.budget}
              onChange={(event) => setConvertValues((v) => ({ ...v, budget: event.target.value }))}
            />
          </div>
          <Select
            label="Assign a staff member now (optional)"
            value={convertValues.staffId}
            onChange={(event) => setConvertValues((v) => ({ ...v, staffId: event.target.value }))}
            options={staffOptions}
            placeholder="Assign later"
          />
          <p className="text-sm text-ink-500">
            Files attached to the request are copied across, and the request is marked as converted.
          </p>
        </div>
      </Modal>
    </>
  );
};

export default RequestActions;
