import { FileText, CalendarClock, Wallet, User, Hash } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../ui/Card.jsx';
import ProjectStatusBadge from './ProjectStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatCurrency, formatDate, formatDateTime, labelForServiceType } from '../../utils/format.js';

const Detail = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
    <div className="min-w-0">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="truncate text-sm font-medium text-ink-800">{children}</p>
    </div>
  </div>
);

const ProjectDetails = ({ project, showClient = false }) => (
  <Card>
    <CardHeader
      title={project.title}
      description={`${project.projectNumber} · created ${formatDateTime(project.createdAt)}`}
      action={
        <div className="flex flex-wrap gap-2">
          <PriorityBadge priority={project.priority} />
          <ProjectStatusBadge status={project.status} />
        </div>
      }
    />
    <CardBody className="space-y-5">
      <ProgressBar value={project.progress} tone={project.status === 'COMPLETED' ? 'success' : 'brand'} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Detail icon={FileText} label="Service">
          {labelForServiceType(project.serviceType)}
        </Detail>
        <Detail icon={CalendarClock} label="Deadline">
          {formatDate(project.deadline)}
        </Detail>
        <Detail icon={Wallet} label="Budget">
          {formatCurrency(project.budget)}
        </Detail>
        {showClient ? (
          <Detail icon={User} label="Client">
            {project.client?.name || '—'}
          </Detail>
        ) : (
          project.request && (
            <Detail icon={Hash} label="From request">
              {project.request.requestNumber || '—'}
            </Detail>
          )
        )}
      </div>

      <div>
        <h3 className="mb-1 text-sm font-semibold text-ink-900">Description</h3>
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{project.description}</p>
      </div>

      {project.instructions && (
        <div>
          <h3 className="mb-1 text-sm font-semibold text-ink-900">Instructions</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-600">{project.instructions}</p>
        </div>
      )}

      {project.clientFeedback && (
        <div className="rounded-lg border border-ink-100 bg-ink-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-900">Client feedback</h3>
          <p className="mt-1 text-sm text-ink-600">{project.clientFeedback}</p>
        </div>
      )}

      {project.cancellationReason && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-rose-800">Cancelled</h3>
          <p className="mt-1 text-sm text-rose-700">{project.cancellationReason}</p>
        </div>
      )}
    </CardBody>
  </Card>
);

export default ProjectDetails;
