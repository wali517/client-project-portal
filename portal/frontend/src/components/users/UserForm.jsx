import { useForm } from 'react-hook-form';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Button from '../ui/Button.jsx';
import { ROLE_LABELS } from '../../constants/index.js';

const roleOptions = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Create and edit share one form. On edit the password field is optional and
 * only sent when the admin actually types a new one.
 */
const UserForm = ({ defaultValues = {}, onSubmit, isSubmitting, mode = 'create', onCancel }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'CLIENT',
      phone: '',
      company: '',
      ...defaultValues,
    },
  });

  const submit = (values) => {
    const payload = { ...values };
    if (!payload.password) delete payload.password;
    if (!payload.phone) delete payload.phone;
    if (!payload.company) delete payload.company;
    return onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
      <Input
        label="Full name"
        required
        error={errors.name?.message}
        {...register('name', { required: 'Enter a name', minLength: { value: 2, message: 'Name is too short' } })}
      />

      <Input
        label="Email"
        type="email"
        required
        hint={mode === 'edit' ? 'Changing this changes what they sign in with.' : undefined}
        error={errors.email?.message}
        {...register('email', {
          required: 'Enter an email',
          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
        })}
      />

      <Input
        label={mode === 'create' ? 'Temporary password' : 'New password (optional)'}
        type="password"
        required={mode === 'create'}
        hint="At least 8 characters with an uppercase letter, a number and a symbol."
        error={errors.password?.message}
        {...register('password', {
          required: mode === 'create' ? 'Set a starting password' : false,
          minLength: { value: 8, message: 'Use at least 8 characters' },
        })}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Role"
          required
          options={roleOptions}
          error={errors.role?.message}
          {...register('role', { required: 'Choose a role' })}
        />
        <Input label="Phone" {...register('phone')} />
      </div>

      <Input label="Company" {...register('company')} />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {mode === 'create' ? 'Create account' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
