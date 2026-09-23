import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import DataState from '../../components/ui/DataState.jsx';
import RequestDetails from '../../components/requests/RequestDetails.jsx';
import RequestActions from '../../components/requests/RequestActions.jsx';
import FileList from '../../components/files/FileList.jsx';
import FileUploader from '../../components/files/FileUploader.jsx';
import MessageThread from '../../components/messaging/MessageThread.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import { getRequest, getRequestActivity, getRequestMessages, sendRequestMessage } from '../../api/requestApi.js';
import { FILE_CATEGORY } from '../../constants/index.js';

const AdminRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('details');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchRequest = useCallback(() => getRequest(id), [id]);
  const { data, isLoading, error, refetch } = useFetch(fetchRequest, [id]);

  const fetchActivity = useCallback(() => getRequestActivity(id, { limit: 50 }), [id]);
  const { data: activityData, isLoading: isActivityLoading, error: activityError, refetch: refetchActivity } = useFetch(
    fetchActivity,
    [id, tab],
    { enabled: tab === 'activity' }
  );

  const fetchMessages = useCallback(() => getRequestMessages(id), [id]);
  const sendMessage = useCallback((payload) => sendRequestMessage(id, payload), [id]);

  const request = data?.data?.request;
  const files = data?.data?.files || [];

  return (
    <PageContainer>
      <PageHeader
        title={request?.title || 'Request'}
        description={request?.requestNumber}
        backTo="/admin/requests"
        backLabel="All requests"
        actions={
          request && (
            <RequestActions
              request={request}
              onChanged={refetch}
              onDeleted={() => navigate('/admin/requests', { replace: true })}
            />
          )
        }
      />

      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading request…">
        {request && (
          <div className="space-y-5">
            <RequestDetails request={request} showClient />

            <Card>
              <Tabs
                active={tab}
                onChange={setTab}
                tabs={[
                  { value: 'details', label: 'Attachments', count: files.length },
                  { value: 'messages', label: 'Messages', count: unreadCount || undefined },
                  { value: 'activity', label: 'Activity' },
                ]}
              />
              <CardBody>
                {tab === 'details' && (
                  <div className="space-y-5">
                    <FileList files={files} currentUser={user} onChanged={refetch} />
                    <FileUploader
                      requestId={id}
                      category={FILE_CATEGORY.REQUEST_ATTACHMENT}
                      onUploaded={refetch}
                    />
                  </div>
                )}

                {tab === 'messages' && (
                  <MessageThread
                    fetchMessages={fetchMessages}
                    sendMessage={sendMessage}
                    onUnreadChange={setUnreadCount}
                  />
                )}

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
        )}
      </DataState>
    </PageContainer>
  );
};

export default AdminRequestDetail;
