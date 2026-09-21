import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import DataState from '../../components/ui/DataState.jsx';
import ProjectDetails from '../../components/projects/ProjectDetails.jsx';
import ProjectActions from '../../components/projects/ProjectActions.jsx';
import ProjectProgress from '../../components/projects/ProjectProgress.jsx';
import StatusChanger from '../../components/projects/StatusChanger.jsx';
import AssignmentManager from '../../components/projects/AssignmentManager.jsx';
import RevisionList from '../../components/projects/RevisionList.jsx';
import FileList from '../../components/files/FileList.jsx';
import FileUploader from '../../components/files/FileUploader.jsx';
import MessageThread from '../../components/messaging/MessageThread.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getProject, getProjectActivity } from '../../api/projectApi.js';
import { listProjectMessages, sendProjectMessage } from '../../api/messageApi.js';
import { FILE_CATEGORY, PROJECT_STATUS, ROLES } from '../../constants/index.js';

const StaffProjectDetail = ({ defaultTab = 'files' }) => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState(defaultTab);

  const fetchProject = useCallback(() => getProject(id), [id]);
  const { data, isLoading, error, refetch } = useFetch(fetchProject, [id]);

  const fetchActivity = useCallback(() => getProjectActivity(id, { limit: 50 }), [id]);
  const { data: activityData, isLoading: isActivityLoading, error: activityError, refetch: refetchActivity } = useFetch(
    fetchActivity,
    [id, tab],
    { enabled: tab === 'activity' }
  );

  const fetchMessages = useCallback(() => listProjectMessages(id), [id]);
  const sendMessage = useCallback((payload) => sendProjectMessage(id, payload), [id]);

  const project = data?.data?.project;
  const assignments = data?.data?.assignments || [];
  const files = data?.data?.files || [];
  const revisions = data?.data?.revisions || [];
  const isClosed = project && [PROJECT_STATUS.COMPLETED, PROJECT_STATUS.CANCELLED].includes(project.status);

  return (
    <PageContainer>
      <PageHeader
        title={project?.title || 'Project'}
        description={project?.projectNumber}
        backTo="/staff/projects"
        backLabel="My projects"
        actions={project && <ProjectActions project={project} user={user} onChanged={refetch} />}
      />

      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading project…">
        {project && (
          <div className="space-y-5">
            <ProjectDetails project={project} showClient />

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
              <div className="space-y-5 xl:col-span-2">
                <Card>
                  <Tabs
                    active={tab}
                    onChange={setTab}
                    tabs={[
                      { value: 'files', label: 'Files', count: files.length },
                      { value: 'revisions', label: 'Revisions', count: revisions.length },
                      { value: 'messages', label: 'Messages' },
                      { value: 'activity', label: 'Activity' },
                    ]}
                  />
                  <CardBody>
                    {tab === 'files' && (
                      <div className="space-y-5">
                        <FileList files={files} currentUser={user} onChanged={refetch} />
                        {!isClosed && (
                          <FileUploader
                            projectId={id}
                            category={FILE_CATEGORY.DELIVERABLE}
                            label="Upload deliverables"
                            onUploaded={refetch}
                          />
                        )}
                      </div>
                    )}

                    {tab === 'revisions' && <RevisionList revisions={revisions} />}

                    {tab === 'messages' && <MessageThread fetchMessages={fetchMessages} sendMessage={sendMessage} />}

                    {tab === 'activity' && (
                      <DataState
                        isLoading={isActivityLoading}
                        error={activityError}
                        onRetry={refetchActivity}
                        loadingLabel="Loading activity…"
                      >
                        <ActivityTimeline entries={activityData?.data || []} />
                      </DataState>
                    )}
                  </CardBody>
                </Card>
              </div>

              <div className="space-y-5">
                <Card>
                  <CardHeader title="Progress" />
                  <CardBody>
                    <ProjectProgress project={project} onUpdated={refetch} disabled={isClosed} />
                  </CardBody>
                </Card>

                {!isClosed && (
                  <Card>
                    <CardHeader title="Status" />
                    <CardBody>
                      <StatusChanger project={project} role={ROLES.STAFF} onUpdated={refetch} />
                    </CardBody>
                  </Card>
                )}

                <Card>
                  <CardHeader title="Team" />
                  <CardBody>
                    <AssignmentManager project={project} assignments={assignments} readOnly />
                  </CardBody>
                </Card>
              </div>
            </div>
          </div>
        )}
      </DataState>
    </PageContainer>
  );
};

export default StaffProjectDetail;
