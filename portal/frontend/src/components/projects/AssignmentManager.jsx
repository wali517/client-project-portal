import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserPlus, X } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import Avatar from '../ui/Avatar.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { listUsers } from '../../api/userApi.js';
import { assignStaff, unassignStaff } from '../../api/projectApi.js';
import { getErrorMessage } from '../../utils/errors.js';
import { ROLES } from '../../constants/index.js';

const AssignmentManager = ({ project, assignments = [], onChanged, readOnly = false }) => {
  const [staffOptions, setStaffOptions] = useState([]);
  const [selected, setSelected] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (readOnly) return;
    listUsers({ role: ROLES.STAFF, isActive: 'true', limit: 100 })
      .then((response) =>
        setStaffOptions(response.data.map((staff) => ({ value: staff._id, label: `${staff.name} · ${staff.email}` })))
      )
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [readOnly]);

  const assignedIds = assignments.map((assignment) => assignment.staff?._id);
  const available = staffOptions.filter((option) => !assignedIds.includes(option.value));

  const assign = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await assignStaff(project._id, { staffIds: [selected] });
      toast.success('Staff assigned');
      setSelected('');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (staffId) => {
    try {
      await unassignStaff(project._id, staffId);
      toast.success('Staff removed from the project');
      onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      {assignments.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No one is working on this yet"
          description={readOnly ? 'An admin will assign the team shortly.' : 'Assign a staff member to get started.'}
        />
      ) : (
        <ul className="divide-y divide-ink-50">
          {assignments.map((assignment) => (
            <li key={assignment._id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={assignment.staff?.name} src={assignment.staff?.avatar} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900">{assignment.staff?.name}</p>
                  <p className="truncate text-xs text-ink-500">{assignment.staff?.email}</p>
                </div>
              </div>
              {!readOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  icon={X}
                  onClick={() => remove(assignment.staff?._id)}
                  aria-label={`Remove ${assignment.staff?.name}`}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            options={available}
            placeholder={available.length ? 'Choose a staff member' : 'No other staff available'}
            aria-label="Staff member"
          />
          <Button onClick={assign} isLoading={isSaving} disabled={!selected} icon={UserPlus}>
            Assign
          </Button>
        </div>
      )}
    </div>
  );
};

export default AssignmentManager;
