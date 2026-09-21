import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import RequestTable from '../../components/requests/RequestTable.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import { listRequests } from '../../api/requestApi.js';
import {
  PRIORITY_LABELS,
  REQUEST_STATUS_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
} from '../../constants/index.js';

const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));

const AdminRequests = () => {
  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listRequests, { initialFilters: { status: '', priority: '', serviceType: '' } });

  return (
    <PageContainer>
      <PageHeader title="Requests" description="Everything clients have submitted, newest first." />

      <Card>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by number, title or description…"
          onReset={resetFilters}
          filters={[
            {
              key: 'status',
              value: filters.status,
              placeholder: 'Any status',
              options: toOptions(REQUEST_STATUS_LABELS),
              onChange: (value) => updateFilter('status', value),
            },
            {
              key: 'priority',
              value: filters.priority,
              placeholder: 'Any priority',
              options: toOptions(PRIORITY_LABELS),
              onChange: (value) => updateFilter('priority', value),
            },
            {
              key: 'serviceType',
              value: filters.serviceType,
              placeholder: 'Any service',
              options: SERVICE_TYPES.map((value) => ({ value, label: SERVICE_TYPE_LABELS[value] })),
              onChange: (value) => updateFilter('serviceType', value),
            },
          ]}
        />

        <DataState
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          isEmpty={!items.length}
          skeleton={<TableSkeleton />}
          loadingLabel="Loading requests…"
          emptyTitle="No requests found"
          emptyDescription="Try clearing the filters or searching for something else."
        >
          <RequestTable requests={items} showClient buildHref={(row) => `/admin/requests/${row._id}`} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </PageContainer>
  );
};

export default AdminRequests;
