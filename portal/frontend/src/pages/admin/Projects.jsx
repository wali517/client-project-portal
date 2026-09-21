import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import FilterBar from '../../components/ui/FilterBar.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import ProjectTable from '../../components/projects/ProjectTable.jsx';
import ProjectForm from '../../components/projects/ProjectForm.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import { listProjects, createProject } from '../../api/projectApi.js';
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
} from '../../constants/index.js';
import { getErrorMessage } from '../../utils/errors.js';

const AdminProjects = () => {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { items, pagination, filters, updateFilter, resetFilters, search, setSearch, setPage, isLoading, error, refetch } =
    usePaginatedList(listProjects, { initialFilters: { status: '', priority: '', serviceType: '' } });

  const create = async (payload) => {
    setIsSaving(true);
    try {
      const response = await createProject(payload);
      toast.success('Project created');
      setIsCreateOpen(false);
      navigate(`/admin/projects/${response.data._id}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Active and completed work across every client."
        actions={
          <Button icon={Plus} onClick={() => setIsCreateOpen(true)}>
            New project
          </Button>
        }
      />

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
          loadingLabel="Loading projects…"
          emptyTitle="No projects found"
          emptyDescription="Approve a request or create a project directly to get started."
        >
          <ProjectTable projects={items} showClient showStaff buildHref={(row) => `/admin/projects/${row._id}`} />
        </DataState>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New project" size="lg">
        <ProjectForm onSubmit={create} isSubmitting={isSaving} onCancel={() => setIsCreateOpen(false)} />
      </Modal>
    </PageContainer>
  );
};

export default AdminProjects;
