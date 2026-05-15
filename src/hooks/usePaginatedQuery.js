import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/api/supabaseEntities';

export function usePaginatedQuery(
  entityName,
  filters = {},
  options = {}
) {
  const {
    initialPage = 0,
    initialPageSize = 20,
    enabled = true,
    queryKey = [],
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const entity = entities[entityName];

  const dataQueryKey = [
    entityName,
    'paginated',
    page,
    pageSize,
    filters,
    ...queryKey,
  ];

  const countQueryKey = [entityName, 'count', filters, ...queryKey];

  const dataQuery = useQuery({
    queryKey: dataQueryKey,
    queryFn: () =>
      entity.list(filters, { page, pageSize }),
    enabled: !!enabled && !!entity,
  });

  const countQuery = useQuery({
    queryKey: countQueryKey,
    queryFn: () => entity.count(filters),
    enabled: !!enabled && !!entity,
  });

  const isLoading = dataQuery.isLoading || countQuery.isLoading;
  const error = dataQuery.error || countQuery.error;
  const data = dataQuery.data || [];
  const total = countQuery.data || 0;

  return {
    data,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    isLoading,
    error,
  };
}
