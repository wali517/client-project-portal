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

  const [selectedIds, setSelectedIds] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;

  const handleToggle = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map((item) => item._id));
    }
  };

  const handleDelete = async () => {
    setIsClearing(true);
    try {
      const targetIds = selectedIds.length > 0 ? selectedIds : 'all';
      const res = await deleteActivityLogs(targetIds);
      toast.success(res.message || 'Activity deleted successfully');
      setSelectedIds([]);
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
          <div className="flex flex-1 flex-wrap items-center gap-3">
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
            {items.length > 0 && (
              <Button
                type="button"
                variant={isAllSelected ? 'secondary' : 'ghost'}
                size="md"
                onClick={handleSelectAll}
                className="inline-flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer pointer-events-none"
                />
                <span>Select All</span>
              </Button>
            )}

            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setIsConfirmOpen(true)}
              disabled={!items.length || isClearing}
              isLoading={isClearing}
            >
              {selectedIds.length > 0 ? `Delete selected (${selectedIds.length})` : 'Delete all activity'}
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
              selectedIds={selectedIds}
              onToggle={handleToggle}
            />
          </DataState>
        </CardBody>

        <Pagination pagination={pagination} onPageChange={setPage} />
      </Card>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title={selectedIds.length > 0 ? `Delete ${selectedIds.length} selected activity item(s)?` : 'Delete all activity logs?'}
        description={
          selectedIds.length > 0
            ? 'Are you sure you want to delete the selected activity log entries? This action cannot be undone.'
            : 'Are you sure you want to delete the entire activity log? This action cannot be undone.'
        }
        confirmLabel={selectedIds.length > 0 ? 'Delete selected' : 'Delete all'}
        isLoading={isClearing}
      />
    </PageContainer>
  );
};

export default AdminActivity;
