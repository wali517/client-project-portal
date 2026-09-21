import { Link } from 'react-router-dom';
import { FilePlus2, Inbox, Clock, CheckCircle2, FolderKanban, Eye } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import RequestTable from '../../components/requests/RequestTable.jsx';
import ProjectTable from '../../components/projects/ProjectTable.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getDashboard } from '../../api/dashboardApi.js';

const ClientDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useFetch(getDashboard, []);
  const summary = data?.data;
  const stats = summary?.stats || {};

  return (
    <PageContainer>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Track what you have submitted and what the team is building."
        actions={
          <Link to="/client/requests/new">
            <Button icon={FilePlus2}>New request</Button>
          </Link>
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        skeleton={<CardSkeleton count={6} />}
        loadingLabel="Loading your dashboard…"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Requests submitted" value={stats.submitted} icon={Inbox} to="/client/requests" />
          <StatCard label="Awaiting a decision" value={stats.pending} icon={Clock} tone="warning" to="/client/requests" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} tone="success" to="/client/requests" />
          <StatCard label="Active projects" value={stats.activeProjects} icon={FolderKanban} tone="brand" to="/client/projects" />
          <StatCard label="Waiting for your review" value={stats.awaitingReview} icon={Eye} tone="warning" to="/client/projects" />
          <StatCard label="Completed projects" value={stats.completed} icon={CheckCircle2} tone="success" to="/client/projects" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <Card>
              <CardHeader
                title="My latest requests"
                action={
                  <Link to="/client/requests" className="text-sm text-brand-600 hover:underline">
                    View all
                  </Link>
                }
              />
              {summary?.recentRequests?.length ? (
                <RequestTable requests={summary.recentRequests} buildHref={(row) => `/client/requests/${row._id}`} />
              ) : (
                <CardBody className="text-sm text-ink-500">
                  You have not submitted anything yet.{' '}
                  <Link to="/client/requests/new" className="text-brand-600 hover:underline">
                    Create your first request
                  </Link>
                  .
                </CardBody>
              )}
            </Card>

            <Card>
              <CardHeader
                title="My projects"
                action={
                  <Link to="/client/projects" className="text-sm text-brand-600 hover:underline">
                    View all
                  </Link>
                }
              />
              {summary?.recentProjects?.length ? (
                <ProjectTable projects={summary.recentProjects} buildHref={(row) => `/client/projects/${row._id}`} />
              ) : (
                <CardBody className="text-sm text-ink-500">Approved requests turn into projects here.</CardBody>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent activity" />
            <CardBody>
              <ActivityTimeline entries={summary?.activity || []} />
            </CardBody>
          </Card>
        </div>
      </DataState>
    </PageContainer>
  );
};

export default ClientDashboard;
