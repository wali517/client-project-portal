import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import DataState from '../../components/ui/DataState.jsx';
import RequestDetails from '../../components/requests/RequestDetails.jsx';
import RequestForm from '../../components/requests/RequestForm.jsx';
import FileList from '../../components/files/FileList.jsx';
import FileUploader from '../../components/files/FileUploader.jsx';
import MessageThread from '../../components/messaging/MessageThread.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import useFetch from '../../hooks/useFetch.js';
import useAuth from '../../hooks/useAuth.js';
import {
  getRequest,
  getRequestActivity,
  getRequestMessages,
  sendRequestMessage,
  updateRequest,
} from '../../api/requestApi.js';
import { FILE_CATEGORY } from '../../constants/index.js';
import { canEditRequest } from '../../utils/permissions.js';
import { getErrorMessage } from '../../utils/errors.js';

const ClientRequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('details');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
  const editable = canEditRequest(user, request);

  const save = async (payload) => {
    setIsSaving(true);
    try {
      await updateRequest(id, payload);
      toast.success('Request updated');
      setIsEditOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={request?.title || 'Request'}
        description={request?.requestNumber}
        backTo="/client/requests"
        backLabel="My requests"
        actions={
          editable && (
            <Button variant="secondary" icon={Pencil} onClick={() => setIsEditOpen(true)}>
              Edit request
            </Button>
          )
        }
      />

      <DataState isLoading={isLoading} error={error} onRetry={refetch} loadingLabel="Loading request…">
        {request && (
          <div className="space-y-5">
            <RequestDetails request={request} />

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
                    <FileUploader requestId={id} category={FILE_CATEGORY.REQUEST_ATTACHMENT} onUploaded={refetch} />
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

      {request && (
        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit request" size="lg">
          <RequestForm
            defaultValues={{
              title: request.title,
              description: request.description,
              serviceType: request.serviceType,
              priority: request.priority,
              budget: request.budget ?? '',
              deadline: request.deadline,
              instructions: request.instructions || '',
            }}
            onSubmit={save}
            isSubmitting={isSaving}
            submitLabel="Save changes"
            onCancel={() => setIsEditOpen(false)}
          />
        </Modal>
      )}
    </PageContainer>
  );
};

export default ClientRequestDetail;
