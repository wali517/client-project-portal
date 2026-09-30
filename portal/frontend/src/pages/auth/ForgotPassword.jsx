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
  const [error, setError] = useState(null);
  const [mailProblem, setMailProblem] = useState(null);
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

      if (response?.data?.emailDelivered === false) {
        setMailProblem(response.data.emailError || 'The email could not be sent.');
      }
      setIsSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSent && mailProblem) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-xl font-semibold text-ink-900">Email could not be sent</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-amber-900">Developer note (only shown in local development)</p>
          <p className="text-xs text-amber-800 break-words">{mailProblem}</p>
          <ol className="list-decimal space-y-1 pl-4 text-xs text-amber-800">
            <li>
              Open <code>backend/.env</code> and add your real Gmail address and App Password on the{' '}
              <code>SMTP_</code> lines (no <code>#</code> at the start).
            </li>
            <li>Stop the backend and start it again.</li>
            <li>
              Run <code>npm run test:email -- your-address@gmail.com</code> in the backend folder to confirm.
            </li>
            <li>Come back here and try again.</li>
          </ol>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsSent(false);
            setMailProblem(null);
          }}
          className="text-sm text-brand-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

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

        <p className="text-xs text-ink-400">
          Open the email and click the link inside it to choose a new password. Check your spam folder if you
          cannot find it.
        </p>

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
