import { useForm } from 'react-hook-form';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { PRIORITY_LABELS, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';
import { toDateInput } from '../../utils/format.js';

const serviceOptions = SERVICE_TYPES.map((value) => ({ value, label: SERVICE_TYPE_LABELS[value] }));
const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

const RequestForm = ({ defaultValues = {}, onSubmit, isSubmitting, submitLabel = 'Submit request', onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
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

  const submit = (values) => {
    const payload = {
      ...values,
      budget: values.budget === '' ? undefined : Number(values.budget),
      deadline: values.deadline || undefined,
      instructions: values.instructions || undefined,
    };
    return onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        label="Title"
        required
        placeholder="e.g. Rebuild the product catalogue"
        error={errors.title?.message}
        {...register('title', {
          required: 'Give the request a title',
          minLength: { value: 3, message: 'Use at least 3 characters' },
          maxLength: { value: 160, message: 'Keep the title under 160 characters' },
        })}
      />

      <Textarea
        label="What do you need?"
        required
        rows={5}
        placeholder="Describe the work, the audience, and anything already decided."
        error={errors.description?.message}
        {...register('description', {
          required: 'Describe what you need',
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
        <Select label="Priority" options={priorityOptions} error={errors.priority?.message} {...register('priority')} />
        <Input label="Deadline" type="date" error={errors.deadline?.message} {...register('deadline')} />
        <Input
          label="Budget (USD)"
          type="number"
          min="0"
          step="50"
          placeholder="0"
          error={errors.budget?.message}
          {...register('budget', { min: { value: 0, message: 'Budget cannot be negative' } })}
        />
      </div>

      <Textarea
        label="Extra instructions"
        rows={3}
        placeholder="Brand rules, references, technical constraints…"
        error={errors.instructions?.message}
        {...register('instructions')}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default RequestForm;
