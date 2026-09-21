import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { homePathFor } from '../utils/permissions.js';

const NotFound = () => {
  const { user } = useAuth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-4 text-center">
      <p className="tabular text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink-900 sm:text-3xl">We could not find that page</h1>
      <p className="mt-2 max-w-md text-sm text-ink-500">
        The link may be out of date, or the record may have been removed.
      </p>
      <Link to={homePathFor(user)} className="mt-6">
        <Button size="lg">Go to my dashboard</Button>
      </Link>
    </main>
  );
};

export default NotFound;
