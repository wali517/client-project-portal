import { Link } from 'react-router-dom';
import { FolderKanban, Hammer, ClipboardCheck, RefreshCcw, CheckCircle2, CalendarClock } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import StatCard from '../../components/ui/StatCard.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import ProjectTable from '../../components/projects/ProjectTable.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getDashboard } from '../../api/dashboardApi.js';
import { formatDate, isOverdue } from '../../utils/format.js';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useFetch(getDashboard, []);
  const summary = data?.data;
  const stats = summary?.stats || {};

  return (
    <PageContainer>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0] || 'there'}`}
        description="The projects assigned to you and what needs attention."
      />

      <DataState
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        skeleton={<CardSkeleton count={5} />}
        loadingLabel="Loading your projects…"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Assigned to me" value={stats.assigned} icon={FolderKanban} to="/staff/projects" />
          <StatCard label="In progress" value={stats.inProgress} icon={Hammer} tone="brand" to="/staff/projects" />
          <StatCard label="Awaiting review" value={stats.awaitingReview} icon={ClipboardCheck} tone="warning" to="/staff/projects" />
          <StatCard label="Revision required" value={stats.revisionRequired} icon={RefreshCcw} tone="danger" to="/staff/projects" />
          <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="success" to="/staff/projects" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="My projects"
              action={
                <Link to="/staff/projects" className="text-sm text-brand-600 hover:underline">
                  View all
                </Link>
              }
            />
            {summary?.recentProjects?.length ? (
              <ProjectTable
                projects={summary.recentProjects}
                showClient
                buildHref={(row) => `/staff/projects/${row._id}`}
              />
            ) : (
              <CardBody className="text-sm text-ink-500">Nothing is assigned to you yet.</CardBody>
            )}
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Upcoming deadlines" />
              <CardBody>
                {summary?.upcomingDeadlines?.length ? (
                  <ul className="space-y-3">
                    {summary.upcomingDeadlines.map((project) => (
                      <li key={project._id}>
                        <Link
                          to={`/staff/projects/${project._id}`}
                          className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 hover:bg-ink-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium text-ink-900">{project.title}</span>
                            <span className="block truncate text-xs text-ink-500">{project.client?.name}</span>
                          </span>
                          <span
                            className={`shrink-0 whitespace-nowrap text-xs ${
                              isOverdue(project.deadline, project.status) ? 'text-rose-600' : 'text-ink-500'
                            }`}
                          >
                            <CalendarClock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                            {formatDate(project.deadline)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-500">No deadlines coming up.</p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Recent activity" />
              <CardBody>
                <ActivityTimeline entries={summary?.activity || []} />
              </CardBody>
            </Card>
          </div>
        </div>
      </DataState>
    </PageContainer>
  );
};

export default StaffDashboard;
