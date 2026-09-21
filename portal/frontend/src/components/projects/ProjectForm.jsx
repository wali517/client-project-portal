import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { listUsers } from '../../api/userApi.js';
import { PRIORITY_LABELS, ROLES, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';
import { toDateInput } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const serviceOptions = SERVICE_TYPES.map((value) => ({ value, label: SERVICE_TYPE_LABELS[value] }));
const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Used both for creating a project and editing one. `mode="edit"` hides the
 * client picker, because a project cannot change owner once it exists.
 */
const ProjectForm = ({ defaultValues = {}, onSubmit, isSubmitting, mode = 'create', onCancel, submitLabel }) => {
  const [clients, setClients] = useState([]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      client: '',
      title: '',
      description: '',
      serviceType: 'WEB_DEVELOPMENT',
      priority: 'MEDIUM',
      budget: '',
      instructions: '',
      ...defaultValues,
      deadline: toDateInput(defaultValues.deadline),
    },
  });

  useEffect(() => {
    if (mode !== 'create') return;
    listUsers({ role: ROLES.CLIENT, isActive: 'true', limit: 100 })
      .then((response) =>
        setClients(response.data.map((client) => ({ value: client._id, label: `${client.name} · ${client.email}` })))
      )
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [mode]);

  const submit = (values) => {
    const payload = {
      ...values,
      budget: values.budget === '' ? undefined : Number(values.budget),
      deadline: values.deadline || undefined,
      instructions: values.instructions || undefined,
    };
    if (mode !== 'create') delete payload.client;
    return onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      {mode === 'create' && (
        <Select
          label="Client"
          required
          options={clients}
          placeholder={clients.length ? 'Choose the client' : 'Loading clients…'}
          error={errors.client?.message}
          {...register('client', { required: 'Choose which client this is for' })}
        />
      )}

      <Input
        label="Title"
        required
        error={errors.title?.message}
        {...register('title', {
          required: 'Give the project a title',
          minLength: { value: 3, message: 'Use at least 3 characters' },
        })}
      />

      <Textarea
        label="Description"
        required
        rows={4}
        error={errors.description?.message}
        {...register('description', {
          required: 'Describe the project',
          minLength: { value: 10, message: 'Add a bit more detail (10 characters minimum)' },
        })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Service"
          required
          options={serviceOptions}
          error={errors.serviceType?.message}
          {...register('serviceType', { required: 'Choose a service' })}
        />
        <Select label="Priority" options={priorityOptions} {...register('priority')} />
        <Input label="Deadline" type="date" {...register('deadline')} />
        <Input
          label="Budget (USD)"
          type="number"
          min="0"
          step="50"
          error={errors.budget?.message}
          {...register('budget', { min: { value: 0, message: 'Budget cannot be negative' } })}
        />
      </div>

      <Textarea label="Instructions" rows={3} {...register('instructions')} />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel || (mode === 'create' ? 'Create project' : 'Save changes')}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
