import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { checklistApi } from '@legends/shared/src/api/communityApi';

export function useChecklistTemplates() {
  return useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => {
      const result = await checklistApi.getTemplates(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });
}

export function useMyChecklist(templateId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-checklist', user?.id, templateId],
    queryFn: async () => {
      if (!user) return null;
      const result = await checklistApi.getUserChecklist(supabase, user.id, templateId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && !!templateId,
  });
}

export function useMyChecklistProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-checklists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const result = await checklistApi.getProgress(supabase, user.id);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!user,
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('Not authenticated');
      const result = await checklistApi.createUserChecklist(supabase, user.id, templateId);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['user-checklists'] });
    },
  });
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checklistId,
      itemId,
      currentItems,
    }: {
      checklistId: string;
      itemId: string;
      currentItems: string[];
    }) => {
      const newItems = currentItems.includes(itemId)
        ? currentItems.filter((i) => i !== itemId)
        : [...currentItems, itemId];

      const result = await checklistApi.toggleItem(supabase, checklistId, newItems);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-checklist'] });
      queryClient.invalidateQueries({ queryKey: ['user-checklists'] });
    },
  });
}
