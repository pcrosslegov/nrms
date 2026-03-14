import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export interface DocumentLanguage {
  documentId: string;
  languageId: string;
  pageTitle: string;
  organizations: string;
  headline: string;
  subheadline: string;
  byline: string;
  bodyHtml: string;
}

export interface DocumentContact {
  documentId: string;
  languageId: string;
  sortIndex: number;
  information: string;
}

export interface ReleaseDocument {
  id: string;
  releaseId: string;
  sortIndex: number;
  pageLayout: number;
  languages: DocumentLanguage[];
  contacts: DocumentContact[];
}

export interface ReleaseLanguage {
  releaseId: string;
  languageId: string;
  location: string;
  summary: string;
  socialMediaHeadline?: string;
  socialMediaSummary?: string;
}

export interface Ministry {
  id: string;
  displayName: string;
  abbreviation: string;
}

export interface Release {
  id: string;
  releaseType: string;
  key: string;
  reference: string;
  isCommitted: boolean;
  isPublished: boolean;
  releaseDateTime: string | null;
  publishDateTime: string | null;
  ministryId: string | null;
  keywords: string;
  publishToWeb: boolean;
  publishToNewsOnDemand: boolean;
  publishToMediaDistribution: boolean;
  hasMediaAssets: boolean;
  updatedAt: string;
  createdAt: string;
  ministry?: Ministry | null;
  languages?: ReleaseLanguage[];
  documents?: ReleaseDocument[];
  ministries?: { ministry: Ministry }[];
  sectors?: { sector: { id: string; key: string; displayName: string } }[];
  themes?: { theme: { id: string; key: string; displayName: string } }[];
  tags?: { tag: { id: string; key: string; displayName: string } }[];
  distributions?: { mediaDistribution: { id: string; key: string; displayName: string } }[];
  logs?: { id: number; dateTime: string; description: string; userId: string | null }[];
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

export function useRelease(id: string) {
  return useQuery({
    queryKey: ['release', id],
    queryFn: () => api<Release>(`/api/releases/${id}`),
    enabled: !!id,
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

export function useUpdateRelease(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api<Release>(`/api/releases/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['release', id] });
      qc.invalidateQueries({ queryKey: ['releases'] });
    },
  });
}

export function useUpdateReleaseLanguage(releaseId: string, langId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api(`/api/releases/${releaseId}/language/${langId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}

export function useUpdateAssociations(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      ministryIds?: string[];
      sectorIds?: string[];
      themeIds?: string[];
      tagIds?: string[];
      mediaDistributionListIds?: string[];
    }) =>
      api<Release>(`/api/releases/${releaseId}/associations`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}

export function useUpdateDocumentLanguage(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      docId,
      langId,
      data,
    }: {
      docId: string;
      langId: string;
      data: Record<string, unknown>;
    }) =>
      api(`/api/releases/${releaseId}/documents/${docId}/languages/${langId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}

export function useSetDocumentContacts(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      docId,
      langId,
      contacts,
    }: {
      docId: string;
      langId: string;
      contacts: string[];
    }) =>
      api(`/api/releases/${releaseId}/documents/${docId}/languages/${langId}/contacts`, {
        method: 'PUT',
        body: JSON.stringify({ contacts }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}

export function useCreateDocument(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api(`/api/releases/${releaseId}/documents`, { method: 'POST', body: '{}' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}

export function useDeleteDocument(releaseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (docId: string) =>
      api(`/api/releases/${releaseId}/documents/${docId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['release', releaseId] }),
  });
}
