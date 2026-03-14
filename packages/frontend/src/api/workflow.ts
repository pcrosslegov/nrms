import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Release } from './releases';

export function useApprove(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<Release>(`/api/releases/${releaseId}/workflow/approve`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['release', releaseId] });
      qc.invalidateQueries({ queryKey: ['releases'] });
    },
  });
}

export function useSchedule(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publishDateTime: string) =>
      api<Release>(`/api/releases/${releaseId}/workflow/schedule`, {
        method: 'POST',
        body: JSON.stringify({ publishDateTime }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['release', releaseId] });
      qc.invalidateQueries({ queryKey: ['releases'] });
    },
  });
}

export function usePublish(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<Release & { generatedHtml?: string }>(`/api/releases/${releaseId}/workflow/publish`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['release', releaseId] });
      qc.invalidateQueries({ queryKey: ['releases'] });
    },
  });
}

export function useUnpublish(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api<Release>(`/api/releases/${releaseId}/workflow/unpublish`, {
        method: 'POST',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['release', releaseId] });
      qc.invalidateQueries({ queryKey: ['releases'] });
    },
  });
}

export function usePreview(releaseId: string, enabled = false) {
  return useQuery({
    queryKey: ['preview', releaseId],
    queryFn: () =>
      api<{ html: string; txt: string }>(
        `/api/releases/${releaseId}/workflow/preview`,
      ),
    enabled,
  });
}
