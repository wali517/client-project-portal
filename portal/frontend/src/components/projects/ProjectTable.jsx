import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import Table from '../ui/Table.jsx';
import ProjectCard from './ProjectCard.jsx';
import ProjectStatusBadge from './ProjectStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import ProgressBar from '../ui/ProgressBar.jsx';
import { formatDate, isOverdue, labelForServiceType } from '../../utils/format.js';

const ProjectTable = ({ projects = [], buildHref, showClient = false, showStaff = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'projectNumber',
      header: 'Project',
      render: (row) => (
        <div className="min-w-0">
          <p className="tabular text-xs font-medium text-brand-600">{row.projectNumber}</p>
          <p className="truncate font-medium text-ink-900">{row.title}</p>
        </div>
      ),
    },
    ...(showClient ? [{ key: 'client', header: 'Client', render: (row) => row.client?.name || '—' }] : []),
    ...(showStaff
      ? [
          {
            key: 'staff',
            header: 'Assigned',
            render: (row) =>
              row.assignments?.length
                ? row.assignments.map((assignment) => assignment.staff?.name).filter(Boolean).join(', ')
                : 'Unassigned',
          },
        ]
      : []),
    { key: 'serviceType', header: 'Service', render: (row) => labelForServiceType(row.serviceType) },
    { key: 'priority', header: 'Priority', render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: 'status', header: 'Status', render: (row) => <ProjectStatusBadge status={row.status} /> },
    {
      key: 'progress',
      header: 'Progress',
      render: (row) => <ProgressBar value={row.progress} showLabel={false} className="w-28" />,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (row) => (
        <span className={isOverdue(row.deadline, row.status) ? 'inline-flex items-center gap-1 text-rose-600' : ''}>
          {isOverdue(row.deadline, row.status) && <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />}
          {formatDate(row.deadline)}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="hidden md:block">
        <Table columns={columns} rows={projects} onRowClick={(row) => navigate(buildHref(row))} />
      </div>
      <div className="md:hidden">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} to={buildHref(project)} showClient={showClient} />
        ))}
      </div>
    </>
  );
};

export default ProjectTable;
