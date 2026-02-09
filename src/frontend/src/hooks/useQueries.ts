import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { SchroedingkOrder, UserProfile, ExternalBlob } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// PDF Upload
export function useUploadSensitiveFile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ blob, filename }: { blob: ExternalBlob; filename: string }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useUploadSensitiveFile] Starting upload:', { filename });
      try {
        const result = await actor.uploadSensitiveFile(blob, filename);
        console.log('[useUploadSensitiveFile] Upload successful:', { fileId: result });
        return result;
      } catch (error) {
        console.error('[useUploadSensitiveFile] Upload failed:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

// Sensitive Words Queries
export function useGetAllSensitiveWords() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, string]>>({
    queryKey: ['sensitiveWords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSensitiveWords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveSensitiveWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (word: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveSensitiveWord(word);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitiveWords'] });
    },
  });
}

export function useUpdateSensitiveWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, word }: { id: bigint; word: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateSensitiveWord(id, word);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitiveWords'] });
    },
  });
}

export function useRemoveSensitiveWord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeSensitiveWord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sensitiveWords'] });
    },
  });
}

// Orders Queries
export function useGetAllOrders() {
  const { actor, isFetching } = useActor();

  return useQuery<SchroedingkOrder[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: SchroedingkOrder) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createOrder(order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, order }: { id: bigint; order: SchroedingkOrder }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateOrder(id, order);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useDeleteOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteOrder(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
