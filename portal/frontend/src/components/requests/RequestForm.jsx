import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { UploadCloud, X } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { PRIORITY_LABELS, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';
import { toDateInput, formatFileSize } from '../../utils/format.js';
import cn from '../../utils/cn.js';

const serviceOptions = SERVICE_TYPES.map((value) => ({ value, label: SERVICE_TYPE_LABELS[value] }));
const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));
const MAX_SIZE_MB = 15;

const RequestForm = ({
  defaultValues = {},
  onSubmit,
  isSubmitting,
  submitLabel = 'Submit request',
  onCancel,
  requireAttachments = false,
}) => {
  const fileInputRef = useRef(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [attachmentError, setAttachmentError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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

  const handleAddFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const valid = incoming.filter((file) => file.size <= MAX_SIZE_MB * 1024 * 1024);
    if (incoming.length > valid.length) {
      setAttachmentError(`Each file must be ${MAX_SIZE_MB}MB or smaller.`);
    } else {
      setAttachmentError('');
    }
    setAttachedFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = (values) => {
    if (requireAttachments && attachedFiles.length === 0) {
      setAttachmentError('Attachments are required before submitting the request.');
      return;
    }
    setAttachmentError('');
    const payload = {
      ...values,
      budget: values.budget === '' ? undefined : Number(values.budget),
      deadline: values.deadline || undefined,
      instructions: values.instructions || undefined,
    };
    return onSubmit(payload, attachedFiles);
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

      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink-900">
          Attachments <span className="text-xs text-ink-500 font-normal">(Optional)</span>
        </label>
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            handleAddFiles(event.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'cursor-pointer rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/30',
            isDragging ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-50/50'
          )}
        >
          <UploadCloud className="mx-auto h-6 w-6 text-ink-400" aria-hidden="true" />
          <p className="mt-2 text-sm text-ink-600">
            <span className="hidden sm:inline">Drop files here, or </span>
            <span className="font-medium text-brand-600 underline-offset-2 hover:underline">
              choose files
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-500">Attach briefs, references, or specifications if you have them</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              handleAddFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </div>

        {attachmentError && <p className="text-xs text-rose-600">{attachmentError}</p>}

        {attachedFiles.length > 0 && (
          <ul className="space-y-2 pt-1">
            {attachedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-100 px-3 py-2 bg-white"
              >
                <span className="min-w-0 truncate text-sm text-ink-700">{file.name}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tabular text-xs text-ink-500">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="rounded p-1 text-ink-500 hover:bg-ink-100"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

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
