import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MailCheck } from 'lucide-react';
import Input from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import { forgotPassword } from '../../api/authApi.js';
import { getErrorMessage } from '../../utils/errors.js';

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [resetData, setResetData] = useState(null);
  const [error, setError] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '' } });

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await forgotPassword(values);
      if (response?.data?.token || response?.data?.resetUrl) {
        setResetData(response.data);
      }
      setIsSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center space-y-4">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-ink-900">Check your inbox</h1>
        <p className="text-sm text-ink-500">
          If that email belongs to an account, a reset link is on its way to your mailbox. The link expires in 30 minutes.
        </p>

        {resetData?.token && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-brand-900">Direct Reset Link (Dev / Local Mode):</p>
            <p className="text-xs text-brand-700 break-all">{resetData.resetUrl || `/reset-password?token=${resetData.token}`}</p>
            <Link
              to={`/reset-password?token=${resetData.token}`}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-brand-700"
            >
              Reset Password Now
            </Link>
          </div>
        )}

        <div>
          <Link to="/login" className="inline-block text-sm text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ink-900">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-500">We will email you a link to choose a new one.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email', {
            required: 'Enter your email',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
          })}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Send reset link
        </Button>
        <Link to="/login" className="block text-center text-sm text-brand-600 hover:underline">
          Back to sign in
        </Link>
      </form>
    </div>
  );
};

export default ForgotPassword;
