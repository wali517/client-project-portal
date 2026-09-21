import { useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, RotateCcw } from 'lucide-react';
import PageContainer from '../../components/layout/PageContainer.jsx';
import PageHeader from '../../components/layout/PageHeader.jsx';
import Card, { CardBody } from '../../components/ui/Card.jsx';
import Select from '../../components/ui/Select.jsx';
import Button from '../../components/ui/Button.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import DataState from '../../components/ui/DataState.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import ActivityTimeline from '../../components/activity/ActivityTimeline.jsx';
import usePaginatedList from '../../hooks/usePaginatedList.js';
import { listActivity, deleteActivityLogs } from '../../api/activityApi.js';
import { ACTIVITY_LABELS } from '../../constants/index.js';
import { humanize } from '../../utils/format.js';
import { getErrorMessage } from '../../utils/errors.js';

const actionOptions = Object.keys(ACTIVITY_LABELS).map((value) => ({ value, label: humanize(value) }));

/** The global audit trail. The API only serves this to admins. */
const AdminActivity = () => {
  const { items, pagination, filters, updateFilter, resetFilters, setPage, isLoading, error, refetch } =
    usePaginatedList(listActivity, { initialFilters: { action: '' }, limit: 25 });

  const [selectedId, setSelectedId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const targetIds = selectedId ? [selectedId] : 'all';
      const res = await deleteActivityLogs(targetIds);
      toast.success(res.message || 'Activity cleared successfully');
      setSelectedId(null);
      setIsConfirmOpen(false);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Activity"
        description="Every recorded action across requests, projects, files and accounts."
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex flex-1 items-center gap-3">
            <Select
              value={filters.action}
              onChange={(event) => updateFilter('action', event.target.value)}
              options={actionOptions}
              placeholder="Any action"
              aria-label="Filter by action"
              className="sm:w-72"
            />
            {filters.action && (
              <Button variant="ghost" icon={RotateCcw} onClick={resetFilters}>
                Reset filter
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setIsConfirmOpen(true)}
              disabled={!items.length || isClearing}
              isLoading={isClearing}
            >
              {selectedId ? 'Clear chosen item' : 'Clear activity list'}
            </Button>
          </div>
        </div>

        <CardBody>
          <DataState
            isLoading={isLoading}
            error={error}
            onRetry={refetch}
            isEmpty={!items.length}
            skeleton={<TableSkeleton rows={8} />}
            loadingLabel="Loading activity…"
            emptyTitle="Nothing recorded yet"
            emptyDescription="Actions taken in the portal show up here as they happen."
          >
            <ActivityTimeline
              entries={items}
              selectable={true}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </DataState>
        </CardBody>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleClear}
        title={selectedId ? 'Clear selected activity item?' : 'Clear activity list?'}
        description={
          selectedId
            ? 'Are you sure you want to delete the chosen activity log entry? It will not show up again.'
            : 'Are you sure you want to clear the entire activity list? This action cannot be undone.'
        }
        confirmLabel={selectedId ? 'Clear item' : 'Clear all'}
        isLoading={isClearing}
      />
    </PageContainer>
  );
};

export default AdminActivity;
