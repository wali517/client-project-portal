import cn from '../../utils/cn.js';

/**
 * Desktop: a real table. Mobile: the caller renders cards instead
 * (see the `mobile` prop on each list component), so nothing is squeezed.
 */
export const Table = ({ columns = [], rows = [], keyField = '_id', onRowClick, emptyMessage = 'No records' }) => (
  <div className="scrollbar-thin w-full overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-ink-100 bg-ink-50/60">
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-500', column.className)}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr>
            <td colSpan={columns.length} className="px-4 py-8 text-center text-ink-500">
              {emptyMessage}
            </td>
          </tr>
        )}
        {rows.map((row) => (
          <tr
            key={row[keyField]}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn(
              'border-b border-ink-50 last:border-0',
              onRowClick && 'cursor-pointer transition-colors hover:bg-ink-50'
            )}
          >
            {columns.map((column) => (
              <td key={column.key} className={cn('px-4 py-3 align-middle text-ink-700', column.cellClassName)}>
                {column.render ? column.render(row) : row[column.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default Table;
