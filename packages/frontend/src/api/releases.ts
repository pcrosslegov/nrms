import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface Release {
  id: string;
  releaseType: string;
  key: string;
  reference: string;
  isCommitted: boolean;
  isPublished: boolean;
  releaseDateTime: string | null;
  publishDateTime: string | null;
  updatedAt: string;
  ministry?: { id: string; displayName: string; abbreviation: string } | null;
  languages?: { languageId: string; summary: string }[];
  documents?: {
    id: string;
    languages?: { headline: string; languageId: string }[];
  }[];
}

interface ReleasesResponse {
  items: Release[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useReleases(tab: string, page = 1) {
  return useQuery({
    queryKey: ['releases', tab, page],
    queryFn: () =>
      api<ReleasesResponse>(`/api/releases?tab=${tab}&page=${page}`),
  });
}

export function useCreateRelease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { releaseType?: string; ministryId?: string }) =>
      api<Release>('/api/releases', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['releases'] }),
  });
}
