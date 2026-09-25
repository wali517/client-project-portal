import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';
import { PAGE_SIZE } from '../constants/index.js';
import useDebounce from './useDebounce.js';

export const usePaginatedList = (fetcher, { initialFilters = {}, limit = PAGE_SIZE } = {}) => {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(() => {
    const cleaned = Object.entries(filters).reduce((acc, [key, value]) => {
      if (value !== '' && value !== undefined && value !== null) acc[key] = value;
      return acc;
    }, {});
    if (debouncedSearch) cleaned.search = debouncedSearch;
    return { ...cleaned, page, limit };
  }, [filters, debouncedSearch, page, limit]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetcher(params);
      setItems(response.data || []);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const updateFilter = useCallback((key, value) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearch('');
    setPage(1);
  }, []);

  return {
    items,
    pagination,
    filters,
    updateFilter,
    resetFilters,
    search,
    setSearch: (value) => {
      setPage(1);
      setSearch(value);
    },
    page,
    setPage,
    isLoading,
    error,
    refetch: load,
  };
};

export default usePaginatedList;
