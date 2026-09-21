import { Link } from 'react-router-dom';
import { FilePlus2 } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import RequestTable from '../../components/requests/RequestTable.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import { listRequests } from '../../api/requestApi.js';
import { REQUEST_STATUS_LABELS, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';

const ClientRequests = () => {
  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listRequests, { initialFilters: { status: '', serviceType: '' } });

  return (
    <PageContainer>
      <PageHeader
        title="My requests"
        description="Every request you have submitted and where it stands."
        actions={
          <Link to="/client/requests/new">
            <Button icon={FilePlus2}>New request</Button>
          </Link>
        }
      />

      <Card>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search your requests…"
          onReset={resetFilters}
          filters={[
            {
              key: 'status',
              value: filters.status,
              placeholder: 'Any status',
              options: Object.entries(REQUEST_STATUS_LABELS).map(([value, label]) => ({ value, label })),
              onChange: (value) => updateFilter('status', value),
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
          loadingLabel="Loading your requests…"
          emptyTitle="No requests yet"
          emptyDescription="Tell us what you need and we will take it from there."
          emptyAction={
            <Link to="/client/requests/new">
              <Button icon={FilePlus2}>Create a request</Button>
            </Link>
          }
        >
          <RequestTable requests={items} buildHref={(row) => `/client/requests/${row._id}`} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </PageContainer>
  );
};

export default ClientRequests;
