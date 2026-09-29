import { useState } from 'react';
import toast from 'react-hot-toast';
import Select from '../ui/Select.jsx';
import Input from '../ui/Input.jsx';
import Button from '../ui/Button.jsx';
import { updateProjectStatus } from '../../api/projectApi.js';
import { PROJECT_STATUS_BY_ROLE, PROJECT_STATUS_LABELS } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Offers the statuses this role may set. The API validates the transition
 * itself, so an invalid pick is rejected server side rather than silently applied.
 */
const StatusChanger = ({ project, role, onUpdated }) => {
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const options = (PROJECT_STATUS_BY_ROLE[role] || [])
    .filter((value) => value !== project.status)
    .map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

  if (!options.length) return null;

  const save = async () => {
    if (!status) return;
    setIsSaving(true);
    try {
      const response = await updateProjectStatus(project._id, { status, note: note || undefined });
      toast.success('Status updated');
      setStatus('');
      setNote('');
      onUpdated?.(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <Select
        label="Move to"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        options={options}
        placeholder="Choose a status"
      />
      <Input
        label="Note (optional)"
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Why is this changing?"
        maxLength={1000}
      />
      <Button size="sm" onClick={save} isLoading={isSaving} disabled={!status}>
        Update status
      </Button>
    </div>
  );
};

export default StatusChanger;
