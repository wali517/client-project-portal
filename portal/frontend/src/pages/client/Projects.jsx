import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import ProjectTable from '../../components/projects/ProjectTable.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import { listProjects } from '../../api/projectApi.js';
import { PROJECT_STATUS_LABELS, SERVICE_TYPES, SERVICE_TYPE_LABELS } from '../../constants/index.js';

const ClientProjects = () => {
  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listProjects, { initialFilters: { status: '', serviceType: '' } });

  return (
    <PageContainer>
      <PageHeader title="My projects" description="Work in progress and everything already delivered." />

      <Card>
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search your projects…"
          onReset={resetFilters}
          filters={[
            {
              key: 'status',
              value: filters.status,
              placeholder: 'Any status',
              options: Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
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
          loadingLabel="Loading your projects…"
          emptyTitle="No projects yet"
          emptyDescription="Once a request is approved it becomes a project you can follow here."
        >
          <ProjectTable projects={items} buildHref={(row) => `/client/projects/${row._id}`} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </PageContainer>
  );
};

export default ClientProjects;
