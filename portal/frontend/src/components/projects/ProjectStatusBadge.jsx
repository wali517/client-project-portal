import Badge from '../ui/Badge.jsx';
import { PROJECT_STATUS_TONES } from '../../constants/index.js';
import { labelForProjectStatus } from '../../utils/format.js';

const ProjectStatusBadge = ({ status }) => (
  <Badge tone={PROJECT_STATUS_TONES[status] || 'neutral'} dot>
    {labelForProjectStatus(status)}
  </Badge>
);

export default ProjectStatusBadge;
