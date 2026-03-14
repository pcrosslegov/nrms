import { useQuery } from '@tanstack/react-query';
import { api } from './client';

interface SearchResult {
  id: string;
  releaseType: string;
  key: string;
  reference: string;
  isCommitted: boolean;
  isPublished: boolean;
  releaseDateTime: string | null;
  publishDateTime: string | null;
  updatedAt: string;
  ministryName: string | null;
  ministryAbbreviation: string | null;
  headline: string | null;
  rank: number;
}

interface SearchResponse {
  items: SearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useSearch(query: string, page = 1) {
  return useQuery({
    queryKey: ['search', query, page],
    queryFn: () =>
      api<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}&page=${page}`),
    enabled: query.length >= 2,
  });
}
