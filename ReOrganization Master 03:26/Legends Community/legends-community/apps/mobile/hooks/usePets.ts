import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { petProfilesApi } from '@legends/shared/src/api/communityApi';
import type { PetProfileInsert, PetProfileUpdate } from '@legends/shared/src/api/communityApi';

export function useMyPets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pets', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await petProfilesApi.getByOwner(supabase, user.id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!user,
  });
}

export function useAllPets() {
  return useQuery({
    queryKey: ['pets', 'all'],
    queryFn: async () => {
      const result = await petProfilesApi.getAll(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: ['pet', id],
    queryFn: async () => {
      const result = await petProfilesApi.getById(supabase, id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: PetProfileInsert) => {
      const result = await petProfilesApi.create(supabase, pet);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PetProfileUpdate }) => {
      const result = await petProfilesApi.update(supabase, id, updates);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      queryClient.invalidateQueries({ queryKey: ['pet', id] });
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await petProfilesApi.delete(supabase, id);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}

export function useLostPets() {
  return useQuery({
    queryKey: ['pets', 'lost'],
    queryFn: async () => {
      const result = await petProfilesApi.getLost(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}
