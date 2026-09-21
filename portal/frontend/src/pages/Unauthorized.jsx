import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer.jsx';
import Button from '../components/ui/Button.jsx';
import useAuth from '../hooks/useAuth.js';
import { homePathFor } from '../utils/permissions.js';

const Unauthorized = () => {
  const { user } = useAuth();

  return (
    <PageContainer>
      <div className="card flex flex-col items-center px-6 py-16 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-ink-900 sm:text-2xl">You do not have access to that</h1>
        <p className="mt-2 max-w-md text-sm text-ink-500">
          Your account role does not allow this page. If you think that is wrong, ask an administrator to check your
          permissions.
        </p>
        <Link to={homePathFor(user)} className="mt-6">
          <Button>Back to my dashboard</Button>
        </Link>
      </div>
    </PageContainer>
  );
};

export default Unauthorized;
