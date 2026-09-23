import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import RequestForm from '../../components/requests/RequestForm.jsx';
import { createRequest } from '../../api/requestApi.js';
import { uploadFiles } from '../../api/fileApi.js';
import { FILE_CATEGORY } from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

const ClientNewRequest = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (payload, attachedFiles) => {
    setIsSubmitting(true);
    try {
      const response = await createRequest(payload);
      const created = response.data;

      if (attachedFiles && attachedFiles.length > 0) {
        await uploadFiles({
          files: attachedFiles,
          requestId: created._id,
          category: FILE_CATEGORY.REQUEST_ATTACHMENT,
        });
      }

      toast.success('Request submitted successfully');
      navigate(`/client/requests/${created._id}`, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <RequestForm
            onSubmit={submit}
            isSubmitting={isSubmitting}
            requireAttachments={false}
            onCancel={() => navigate('/client/requests')}
          />
        </CardBody>
      </Card>
    </PageContainer>
  );
};

export default ClientNewRequest;
