import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { resetPassword } from '../../api/authApi.js';
import { getErrorMessage } from '../../utils/errors.js';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tokenFromUrl = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { token: tokenFromUrl, password: '', confirm: '' } });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      await resetPassword({ token: values.token.trim(), password: values.password });
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error, 'That reset link is invalid or has expired.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-ink-500">At least 8 characters, with an uppercase letter, a number and a symbol.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {!tokenFromUrl && (
          <Input
            label="Reset token"
            required
            error={errors.token?.message}
            {...register('token', { required: 'Paste the token from your email' })}
          />
        )}
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register('password', {
            required: 'Choose a password',
            minLength: { value: 8, message: 'Use at least 8 characters' },
            validate: (value) =>
              (/[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value)) ||
              'Include an uppercase letter, a lowercase letter and a number',
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm?.message}
          {...register('confirm', {
            required: 'Repeat the password',
            validate: (value) => value === watch('password') || 'Both passwords must match',
          })}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Update password
        </Button>
        <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
};

export default ResetPassword;
