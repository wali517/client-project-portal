import { useNavigate } from 'react-router-dom';
import Table from '../ui/Table.jsx';
import RequestCard from './RequestCard.jsx';
import RequestStatusBadge from './RequestStatusBadge.jsx';
import PriorityBadge from '../ui/PriorityBadge.jsx';
import { formatCurrency, formatDate, labelForServiceType } from '../../utils/format.js';

const RequestTable = ({ requests = [], buildHref, showClient = false }) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'requestNumber',
      header: 'Request',
      render: (row) => (
        <div className="min-w-0">
          <p className="tabular text-xs font-medium text-brand-600">{row.requestNumber}</p>
          <p className="truncate font-medium text-ink-900">{row.title}</p>
        </div>
      ),
    },
    ...(showClient
      ? [{ key: 'client', header: 'Client', render: (row) => row.client?.name || '—' }]
      : []),
    { key: 'serviceType', header: 'Service', render: (row) => labelForServiceType(row.serviceType) },
    { key: 'priority', header: 'Priority', render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: 'status', header: 'Status', render: (row) => <RequestStatusBadge status={row.status} /> },
    { key: 'deadline', header: 'Deadline', render: (row) => formatDate(row.deadline) },
    { key: 'budget', header: 'Budget', render: (row) => <span className="tabular">{formatCurrency(row.budget)}</span> },
  ];

  return (
    <>
      <div className="hidden md:block">
        <Table columns={columns} rows={requests} onRowClick={(row) => navigate(buildHref(row))} />
      </div>
      <div className="md:hidden">
        {requests.map((request) => (
          <RequestCard key={request._id} request={request} to={buildHref(request)} showClient={showClient} />
        ))}
      </div>
    </>
  );
};

export default RequestTable;
