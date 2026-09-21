import Badge from '../ui/Badge.jsx';
import { REQUEST_STATUS_TONES } from '../../constants/index.js';
import { labelForRequestStatus } from '../../utils/format.js';

const RequestStatusBadge = ({ status }) => (
  <Badge tone={REQUEST_STATUS_TONES[status] || 'neutral'} dot>
    {labelForRequestStatus(status)}
  </Badge>
);

export default RequestStatusBadge;
