import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { updateProjectProgress } from '../../api/projectApi.js';
import { getErrorMessage } from '../../utils/errors.js';

const ProjectProgress = ({ project, onUpdated, disabled = false }) => {
  const [value, setValue] = useState(project.progress ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      const response = await updateProjectProgress(project._id, { progress: Number(value) });
      toast.success('Progress updated');
      onUpdated?.(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <ProgressBar value={value} />
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        className="w-full accent-brand-600"
        aria-label="Project progress"
      />
      <Button size="sm" onClick={save} isLoading={isSaving} disabled={disabled || Number(value) === project.progress}>
        Save progress
      </Button>
    </div>
  );
};

export default ProjectProgress;
