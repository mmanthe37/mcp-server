import React, { useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { checklistApi } from '@legends/shared/src/api/communityApi';
import type { ChecklistTemplateItem } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToggleChecklistItem } from '@/hooks/useChecklists';

function CircularProgress({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = pct === 100 && total > 0;

  return (
    <View className="items-center justify-center w-20 h-20">
      <View
        className={`w-20 h-20 rounded-full border-4 items-center justify-center ${
          isComplete ? 'border-green-500 bg-green-50' : 'border-primary bg-primary/5'
        }`}
      >
        {isComplete ? (
          <Text className="text-2xl">🎉</Text>
        ) : (
          <Text className="text-lg font-bold text-primary">{pct}%</Text>
        )}
      </View>
    </View>
  );
}

function ChecklistItem({
  item,
  isChecked,
  onToggle,
}: {
  item: ChecklistTemplateItem;
  isChecked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      className={`flex-row items-start p-4 mb-2 rounded-xl border ${
        isChecked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
      }`}
    >
      <View
        className={`w-6 h-6 rounded-md mr-3 mt-0.5 items-center justify-center border-2 ${
          isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
        }`}
      >
        {isChecked && <Ionicons name="checkmark" size={16} color="white" />}
      </View>
      <View className="flex-1">
        <Text
          className={`text-base font-semibold ${
            isChecked ? 'text-gray-400 line-through' : 'text-gray-900'
          }`}
        >
          {item.title}
        </Text>
        {item.description && (
          <Text
            className={`text-sm mt-0.5 ${isChecked ? 'text-gray-300' : 'text-gray-500'}`}
          >
            {item.description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toggleItem = useToggleChecklistItem();

  const {
    data: checklist,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user-checklist-detail', id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data, error } = await supabase
        .from('user_checklists')
        .select('*, template:checklist_templates(*)')
        .eq('id', id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!user && !!id,
  });

  const template = checklist?.template;
  const items: ChecklistTemplateItem[] = template?.items ?? [];
  const completedItems: string[] = checklist?.completed_items ?? [];
  const sortedItems = [...items].sort((a, b) => a.order - b.order);
  const completedCount = completedItems.length;
  const totalCount = items.length;
  const isAllComplete = completedCount === totalCount && totalCount > 0;

  const handleToggle = useCallback(
    (itemId: string) => {
      if (!checklist) return;
      toggleItem.mutate({
        checklistId: checklist.id,
        itemId,
        currentItems: completedItems,
      });
    },
    [checklist, completedItems, toggleItem],
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <LoadingSpinner message="Loading checklist..." />
      </View>
    );
  }

  if (!checklist || !template) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Checklist Not Found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderHeader = () => (
    <View className="items-center pb-4 mb-2">
      <CircularProgress completed={completedCount} total={totalCount} />
      <Text className="text-sm font-semibold text-gray-500 mt-3">
        {completedCount}/{totalCount} completed
      </Text>
      {isAllComplete && (
        <View className="mt-3 bg-green-100 px-4 py-2 rounded-full">
          <Text className="text-sm font-bold text-green-700">
            🎉 All tasks complete! Great job!
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy pt-14 pb-5 px-5">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">{template.name}</Text>
            <Text className="text-sm text-blue-200 mt-0.5">
              {completedCount}/{totalCount} completed
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sortedItems}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <ChecklistItem
            item={item}
            isChecked={completedItems.includes(item.id)}
            onToggle={() => handleToggle(item.id)}
          />
        )}
        contentContainerClassName="p-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
}
