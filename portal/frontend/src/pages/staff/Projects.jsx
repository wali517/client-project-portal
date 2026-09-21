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
import { PRIORITY_LABELS, PROJECT_STATUS_LABELS } from '../../constants/index.js';

const StaffProjects = () => {
  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listProjects, { initialFilters: { status: '', priority: '' } });

  return (
    <PageContainer>
      <PageHeader title="My projects" description="Only the projects you are assigned to." />

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
              key: 'priority',
              value: filters.priority,
              placeholder: 'Any priority',
              options: Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
              onChange: (value) => updateFilter('priority', value),
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
          emptyTitle="Nothing assigned yet"
          emptyDescription="When an admin assigns you to a project it will appear here."
        >
          <ProjectTable projects={items} showClient buildHref={(row) => `/staff/projects/${row._id}`} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>
    </PageContainer>
  );
};

export default StaffProjects;
