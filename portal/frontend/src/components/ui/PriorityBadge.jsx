import Badge from './Badge.jsx';
import { PRIORITY_TONES } from '../../constants/index.js';
import { labelForPriority } from '../../utils/format.js';

const PriorityBadge = ({ priority }) => (
  <Badge tone={PRIORITY_TONES[priority] || 'neutral'}>{labelForPriority(priority)}</Badge>
);

export default PriorityBadge;
