import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody, CardHeader } from '../../components/ui/Card.jsx';
import RequestForm from '../../components/requests/RequestForm.jsx';
import FileUploader from '../../components/files/FileUploader.jsx';
import FileList from '../../components/files/FileList.jsx';
import Button from '../../components/ui/Button.jsx';
import useAuth from '../../hooks/useAuth.js';
import { createRequest } from '../../api/requestApi.js';
import { FILE_CATEGORY } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Two steps: save the request first so it has an id, then attach files to it.
 * That keeps uploads tied to a real record rather than a temporary bucket.
 */
const ClientNewRequest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [files, setFiles] = useState([]);

  const submit = async (payload) => {
    setIsSubmitting(true);
    try {
      const response = await createRequest(payload);
      toast.success('Request submitted');
      setCreated(response.data);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (created) {
    return (
      <PageContainer>
        <PageHeader
          title="Attach any files"
          description={`${created.requestNumber} has been submitted. Add briefs, references or examples if you have them.`}
          backTo="/client/requests"
          backLabel="My requests"
        />

        <Card>
          <CardHeader title="Attachments" description="Optional — you can add these later too." />
          <CardBody className="space-y-5">
            <FileList
              files={files}
              currentUser={user}
              emptyDescription="Nothing attached yet."
              onChanged={() => setFiles([])}
            />
            <FileUploader
              requestId={created._id}
              category={FILE_CATEGORY.REQUEST_ATTACHMENT}
              onUploaded={(uploaded) => setFiles((current) => [...current, ...(uploaded || [])])}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => navigate('/client/requests')}>
                Done for now
              </Button>
              <Button onClick={() => navigate(`/client/requests/${created._id}`)}>View request</Button>
            </div>
          </CardBody>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="New request"
        description="Tell us what you need. An admin reviews every request before work starts."
        backTo="/client/requests"
        backLabel="My requests"
      />

      <Card>
        <CardBody>
          <RequestForm onSubmit={submit} isSubmitting={isSubmitting} onCancel={() => navigate('/client/requests')} />
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default ClientNewRequest;
