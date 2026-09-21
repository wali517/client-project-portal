import { Search, X } from 'lucide-react';
import Input from './Input.jsx';
import Select from './Select.jsx';
import Button from './Button.jsx';

/**
 * Search + filter controls shared by every list screen.
 * Filters stack on mobile and sit inline from `sm` upwards.
 */
const FilterBar = ({ search, onSearchChange, searchPlaceholder = 'Search…', filters = [], onReset }) => (
  <div className="flex flex-col gap-3 border-b border-ink-100 px-4 py-3 sm:px-5 lg:flex-row lg:items-end">
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={searchPlaceholder}
        className="pl-9"
        aria-label="Search"
      />
    </div>

    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-end">
      {filters.map((filter) => (
        <Select
          key={filter.key}
          value={filter.value || ''}
          onChange={(event) => filter.onChange(event.target.value)}
          options={filter.options}
          placeholder={filter.placeholder}
          aria-label={filter.placeholder}
          className="lg:w-44"
        />
      ))}
      {onReset && (
        <Button variant="ghost" size="md" icon={X} onClick={onReset} className="col-span-2 sm:col-span-1">
          Clear
        </Button>
      )}
    </div>
  </div>
);

export default FilterBar;
