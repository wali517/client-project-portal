import { Link } from 'react-router-dom';
import { Users, UserCog, Inbox, Eye, FolderKanban, ClipboardCheck, RefreshCcw, CheckCircle2, Plus } from 'lucide-react';
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
import { getDashboard } from '../../api/dashboardApi.js';

const AdminDashboard = () => {
  const { data, isLoading, error, refetch } = useFetch(getDashboard, []);
  const summary = data?.data;
  const stats = summary?.stats || {};

  return (
    <PageContainer>
      <PageHeader
        title="Overview"
        description="Everything moving through the portal right now."
        actions={
          <Link to="/admin/requests">
            <Button icon={Plus}>Review requests</Button>
          </Link>
        }
      />

      <DataState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        skeleton={<CardSkeleton count={8} />}
        loadingLabel="Loading your dashboard…"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Clients" value={stats.totalClients} icon={Users} to="/admin/users" />
          <StatCard label="Staff" value={stats.totalStaff} icon={UserCog} to="/admin/users" />
          <StatCard label="New requests" value={stats.newRequests} icon={Inbox} tone="brand" to="/admin/requests" />
          <StatCard label="Requests under review" value={stats.requestsUnderReview} icon={Eye} tone="warning" to="/admin/requests" />
          <StatCard label="Active projects" value={stats.activeProjects} icon={FolderKanban} to="/admin/projects" />
          <StatCard label="Work awaiting review" value={stats.projectsUnderReview} icon={ClipboardCheck} tone="warning" to="/admin/projects" />
          <StatCard label="Revision required" value={stats.revisionRequired} icon={RefreshCcw} tone="danger" to="/admin/projects" />
          <StatCard label="Completed" value={stats.completedProjects} icon={CheckCircle2} tone="success" to="/admin/projects" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-5 xl:col-span-2">
            <Card>
              <CardHeader
                title="Latest requests"
                action={
                  <Link to="/admin/requests" className="text-sm text-brand-600 hover:underline">
                    View all
                  </Link>
                }
              />
              {summary?.recentRequests?.length ? (
                <RequestTable
                  requests={summary.recentRequests}
                  showClient
                  buildHref={(row) => `/admin/requests/${row._id}`}
                />
              ) : (
                <CardBody className="text-sm text-ink-500">No requests have been submitted yet.</CardBody>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Latest projects"
                action={
                  <Link to="/admin/projects" className="text-sm text-brand-600 hover:underline">
                    View all
                  </Link>
                }
              />
              {summary?.recentProjects?.length ? (
                <ProjectTable
                  projects={summary.recentProjects}
                  showClient
                  buildHref={(row) => `/admin/projects/${row._id}`}
                />
              ) : (
                <CardBody className="text-sm text-ink-500">No projects have been created yet.</CardBody>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Recent activity"
              action={
                <Link to="/admin/activity" className="text-sm text-brand-600 hover:underline">
                  Full history
                </Link>
              }
            />
            <CardBody>
              <ActivityTimeline entries={summary?.activity || []} />
            </CardBody>
          </Card>
        </div>
      </DataState>
    </PageContainer>
  );
};

export default AdminDashboard;
