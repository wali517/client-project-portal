import { Link } from 'react-router-dom';
import { CalendarClock, AlertTriangle } from 'lucide-react';
import ProjectStatusBadge from './ProjectStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatCurrency, formatDate, isOverdue, labelForServiceType } from '../../utils/format.js';

const ProjectCard = ({ project, to, showClient = false }) => (
  <Link to={to} className="block border-b border-ink-50 px-4 py-4 last:border-0 hover:bg-ink-50">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="tabular text-xs font-medium text-brand-600">{project.projectNumber}</p>
        <p className="mt-0.5 truncate font-medium text-ink-900">{project.title}</p>
        {showClient && project.client && <p className="mt-0.5 truncate text-sm text-ink-500">{project.client.name}</p>}
      </div>
      <ProjectStatusBadge status={project.status} />
    </div>
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-500">
      <PriorityBadge priority={project.priority} />
      <span>{labelForServiceType(project.serviceType)}</span>
      <span className="inline-flex items-center gap-1">
        {isOverdue(project.deadline, project.status) ? (
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
        ) : (
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {formatDate(project.deadline)}
      </span>
      <span className="tabular">{formatCurrency(project.budget)}</span>
    </div>
    <ProgressBar value={project.progress} className="mt-3" />
  </Link>
);

export default ProjectCard;
