import { useQuery } from '@tanstack/react-query';
import { api } from './client';

interface RefItem {
  id: string;
  key: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export function useMinistries() {
  return useQuery({
    queryKey: ['ministries'],
    queryFn: () => api<(RefItem & { abbreviation: string })[]>('/api/ministries'),
    staleTime: 5 * 60_000,
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: () => api<RefItem[]>('/api/sectors'),
    staleTime: 5 * 60_000,
  });
}

export function useThemes() {
  return useQuery({
    queryKey: ['themes'],
    queryFn: () => api<RefItem[]>('/api/themes'),
    staleTime: 5 * 60_000,
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => api<RefItem[]>('/api/tags'),
    staleTime: 5 * 60_000,
  });
}

export function useMediaDistributions() {
  return useQuery({
    queryKey: ['mediaDistributions'],
    queryFn: () => api<RefItem[]>('/api/ministries'), // TODO: add endpoint
    staleTime: 5 * 60_000,
    enabled: false, // disabled until endpoint exists
  });
}
