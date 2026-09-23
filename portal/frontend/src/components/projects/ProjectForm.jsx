import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Search, X, Mail, Building2, Phone, Check } from 'lucide-react';
import Input from '../ui/Input.jsx';
import Textarea from '../ui/Textarea.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import Avatar from '../ui/Avatar.jsx';
import { listUsers } from '../../api/userApi.js';
import { PRIORITY_LABELS, ROLES, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';
import { toDateInput } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';
import cn from '../../utils/cn.js';

const serviceOptions = SERVICE_TYPES.map((value) => ({ value, label: SERVICE_TYPE_LABELS[value] }));
const priorityOptions = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Used both for creating a project and editing one. `mode="edit"` hides the
 * client picker, because a project cannot change owner once it exists.
 */
const ProjectForm = ({ defaultValues = {}, onSubmit, isSubmitting, mode = 'create', onCancel, submitLabel }) => {
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const dropdownRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
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
      .then((response) => {
        setClients(response.data || []);
        if (defaultValues.client) {
          const matched = (response.data || []).find((c) => c._id === defaultValues.client);
          if (matched) {
            setSelectedClient(matched);
            setValue('client', matched._id);
          }
        }
      })
      .catch((error) => toast.error(getErrorMessage(error)));
  }, [mode, defaultValues.client, setValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredClients = clients
    .filter((client) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      return (
        client.name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.company?.toLowerCase().includes(query) ||
        client.phone?.includes(query)
      );
    })
    .slice(0, 10);

  const selectClient = (client) => {
    setSelectedClient(client);
    setValue('client', client._id);
    clearErrors('client');
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const clearSelectedClient = () => {
    setSelectedClient(null);
    setValue('client', '');
    setSearchQuery('');
  };

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
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="block text-sm font-medium text-ink-900">
            Client <span className="text-rose-600">*</span>
          </label>

          <input type="hidden" {...register('client', { required: 'Choose which client this is for' })} />

          {selectedClient ? (
            <div className="flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar name={selectedClient.name} src={selectedClient.avatar} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{selectedClient.name}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedClient.email}
                    </span>
                    {selectedClient.company && (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {selectedClient.company}
                      </span>
                    )}
                    {selectedClient.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedClient.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={clearSelectedClient} icon={X}>
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  placeholder="Search client by name, email, company or phone..."
                  className={cn(
                    'w-full rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
                    errors.client ? 'border-rose-300 focus:border-rose-500' : 'border-ink-200 focus:border-brand-500'
                  )}
                />
              </div>

              {isDropdownOpen && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-ink-100 bg-white py-1 shadow-lg">
                  {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                      <button
                        key={client._id}
                        type="button"
                        onClick={() => selectClient(client)}
                        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-brand-50/60"
                      >
                        <Avatar name={client.name} src={client.avatar} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink-900">{client.name}</p>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
                            <span>{client.email}</span>
                            {client.company && <span>· {client.company}</span>}
                            {client.phone && <span>· {client.phone}</span>}
                          </div>
                        </div>
                        {selectedClient?._id === client._id && <Check className="h-4 w-4 text-brand-600" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-ink-500">No matching clients found</div>
                  )}
                </div>
              )}
            </div>
          )}

          {errors.client && <p className="text-xs text-rose-600">{errors.client.message}</p>}
        </div>
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
