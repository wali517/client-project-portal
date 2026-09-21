import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, RefreshCcw, Send, MessageSquarePlus, XCircle, Trash2 } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Textarea from '../ui/Textarea.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import DeleteConfirmDialog from '../ui/DeleteConfirmDialog.jsx';
import {
  approveProject,
  cancelProject,
  deleteProject,
  reviewWork,
  sendFeedback,
  submitWork,
} from '../../api/projectApi.js';
import { createRevision } from '../../api/revisionApi.js';
import { canAdminReview, canClientReview, canSubmitWork, isAdmin, isClient } from '../../utils/permissions.js';
import { PROJECT_STATUS } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * The workflow buttons for whichever role is looking at the project.
 * Everything here is re-checked by the API before it takes effect.
 */
const ProjectActions = ({ project, user, onChanged, onDeleted }) => {
  const [dialog, setDialog] = useState(null); // submit | revision | feedback | approve | cancel | delete
  const [text, setText] = useState('');
  const [extra, setExtra] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const close = () => {
    setDialog(null);
    setText('');
    setExtra('');
  };

  const run = async (action) => {
    setIsSaving(true);
    try {
      await action();
      close();
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const actions = [];

  if (canSubmitWork(user, project)) {
    actions.push(
      <Button key="submit" icon={Send} onClick={() => setDialog('submit')}>
        Submit for review
      </Button>
    );
  }

  if (canAdminReview(user, project)) {
    actions.push(
      <Button key="approve" variant="success" icon={CheckCircle2} onClick={() => setDialog('admin-approve')}>
        Approve work
      </Button>,
      <Button key="revision" variant="warning" icon={RefreshCcw} onClick={() => setDialog('admin-revision')}>
        Request revision
      </Button>
    );
  }

  if (canClientReview(user, project)) {
    actions.push(
      <Button key="client-approve" variant="success" icon={CheckCircle2} onClick={() => setDialog('client-approve')}>
        Approve project
      </Button>,
      <Button key="client-revision" variant="warning" icon={RefreshCcw} onClick={() => setDialog('client-revision')}>
        Request revision
      </Button>
    );
  }

  if (isClient(user) && ![PROJECT_STATUS.CANCELLED].includes(project.status)) {
    actions.push(
      <Button key="feedback" variant="ghost" icon={MessageSquarePlus} onClick={() => setDialog('feedback')}>
        Leave feedback
      </Button>
    );
  }

  if (isAdmin(user) && ![PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED].includes(project.status)) {
    actions.push(
      <Button key="cancel" variant="ghost" icon={XCircle} onClick={() => setDialog('cancel')}>
        Cancel project
      </Button>
    );
  }

  if (isAdmin(user)) {
    actions.push(
      <Button key="delete" variant="danger" icon={Trash2} onClick={() => setDialog('delete')}>
        Delete
      </Button>
    );
  }

  if (!actions.length) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">{actions}</div>

      <Modal
        isOpen={dialog === 'submit'}
        onClose={close}
        title="Submit work for review"
        description="Upload the deliverables first, then send the project to the admin."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button isLoading={isSaving} onClick={() => run(() => submitWork(project._id, { note: text || undefined }))}>
              Submit
            </Button>
          </>
        }
      >
        <Textarea
          label="Note for the admin (optional)"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What has been delivered, anything worth flagging…"
        />
      </Modal>

      <ConfirmDialog
        isOpen={dialog === 'admin-approve'}
        onClose={close}
        isLoading={isSaving}
        variant="success"
        title="Approve this work?"
        description="The project moves to the client for final review."
        confirmLabel="Approve"
        onConfirm={() => run(() => reviewWork(project._id, { decision: 'APPROVE' }))}
      />

      <Modal
        isOpen={dialog === 'admin-revision'}
        onClose={close}
        title="Request a revision"
        description="The project goes back to the assigned staff."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              isLoading={isSaving}
              disabled={text.trim().length < 5}
              onClick={() =>
                run(() =>
                  reviewWork(project._id, {
                    decision: 'REQUEST_REVISION',
                    reason: text.trim(),
                    instructions: extra.trim() || undefined,
                  })
                )
              }
            >
              Request revision
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="What needs to change?"
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
            error={text && text.trim().length < 5 ? 'Give at least 5 characters of detail' : undefined}
          />
          <Textarea
            label="Extra instructions (optional)"
            rows={3}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={dialog === 'client-approve'}
        onClose={close}
        title="Approve the completed project"
        description="This marks the project complete and closes it out."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              variant="success"
              isLoading={isSaving}
              onClick={() => run(() => approveProject(project._id, { feedback: text.trim() || undefined }))}
            >
              Approve project
            </Button>
          </>
        }
      >
        <Textarea
          label="Closing feedback (optional)"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Anything you want the team to know."
        />
      </Modal>

      <Modal
        isOpen={dialog === 'client-revision'}
        onClose={close}
        title="Request changes"
        description="The team will pick this up and resubmit."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              isLoading={isSaving}
              disabled={text.trim().length < 5}
              onClick={() =>
                run(() =>
                  createRevision(project._id, { reason: text.trim(), instructions: extra.trim() || undefined })
                )
              }
            >
              Request revision
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea
            label="What needs to change?"
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
            error={text && text.trim().length < 5 ? 'Give at least 5 characters of detail' : undefined}
          />
          <Textarea
            label="Extra instructions (optional)"
            rows={3}
            value={extra}
            onChange={(event) => setExtra(event.target.value)}
          />
        </div>
      </Modal>

      <Modal
        isOpen={dialog === 'feedback'}
        onClose={close}
        title="Leave feedback"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              isLoading={isSaving}
              disabled={!text.trim()}
              onClick={() => run(() => sendFeedback(project._id, { feedback: text.trim() }))}
            >
              Send feedback
            </Button>
          </>
        }
      >
        <Textarea label="Your feedback" required value={text} onChange={(event) => setText(event.target.value)} />
      </Modal>

      <Modal
        isOpen={dialog === 'cancel'}
        onClose={close}
        title="Cancel this project?"
        description="Cancelling stops all work. This cannot be undone."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={isSaving}>
              Keep project
            </Button>
            <Button
              variant="danger"
              isLoading={isSaving}
              onClick={() => run(() => cancelProject(project._id, { reason: text.trim() || undefined }))}
            >
              Cancel project
            </Button>
          </>
        }
      >
        <Textarea label="Reason (optional)" value={text} onChange={(event) => setText(event.target.value)} />
      </Modal>

      <DeleteConfirmDialog
        isOpen={dialog === 'delete'}
        onClose={close}
        isLoading={isDeleting}
        title={`Permanently delete ${project.projectNumber}?`}
        description="This removes the project, its files, messages, revisions and staff assignments completely — it disappears from every list and cannot be recovered. If it came from a request, the request reopens as approved."
        confirmWith={project.projectNumber}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deleteProject(project._id);
            toast.success(`${project.projectNumber} was permanently deleted`);
            close();
            onDeleted?.();
          } catch (error) {
            toast.error(getErrorMessage(error));
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </>
  );
};

export default ProjectActions;
