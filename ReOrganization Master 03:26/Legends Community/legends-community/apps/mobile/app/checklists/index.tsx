import React from 'react';
import { View, Text, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useChecklistTemplates, useMyChecklistProgress, useCreateChecklist } from '@/hooks/useChecklists';
import type { ChecklistTemplate, UserChecklist } from '@legends/shared/src/api/communityApi';

const TYPE_CONFIG = {
  move_in: { emoji: '📦', label: 'Move-In Checklist', color: 'bg-green-500' },
  move_out: { emoji: '🚚', label: 'Move-Out Checklist', color: 'bg-blue-500' },
};

function ProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View className="mt-3">
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-xs font-medium text-gray-500">
          {completed} of {total} completed
        </Text>
        <Text className="text-xs font-bold text-primary">{Math.round(pct)}%</Text>
      </View>
      <View className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

function ChecklistCard({
  template,
  userChecklist,
  onStart,
  onOpen,
  isCreating,
}: {
  template: ChecklistTemplate;
  userChecklist?: UserChecklist | null;
  onStart: () => void;
  onOpen: () => void;
  isCreating: boolean;
}) {
  const config = TYPE_CONFIG[template.type] ?? TYPE_CONFIG.move_in;
  const items = template.items ?? [];
  const completedCount = userChecklist?.completed_items?.length ?? 0;
  const totalCount = items.length;
  const isStarted = !!userChecklist;
  const isComplete = isStarted && completedCount === totalCount && totalCount > 0;

  return (
    <Card className="mb-4">
      <View className="flex-row items-center mb-3">
        <View className={`w-10 h-10 rounded-xl ${config.color} items-center justify-center mr-3`}>
          <Text className="text-xl">{config.emoji}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">{config.label}</Text>
          {template.description && (
            <Text className="text-xs text-gray-500 mt-0.5">{template.description}</Text>
          )}
        </View>
        {isComplete && <Text className="text-2xl">🎉</Text>}
      </View>

      {isStarted ? (
        <>
          <ProgressBar completed={completedCount} total={totalCount} />
          <TouchableOpacity
            onPress={onOpen}
            className="mt-3 flex-row items-center justify-center py-2.5 bg-primary/10 rounded-xl"
            activeOpacity={0.7}
          >
            <Text className="text-sm font-semibold text-primary mr-1">
              {isComplete ? 'View Completed Checklist' : 'Continue Checklist'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text className="text-sm text-gray-500 mb-3">{totalCount} items to complete</Text>
          <Button
            title="Start Checklist"
            onPress={onStart}
            loading={isCreating}
            size="sm"
          />
        </>
      )}
    </Card>
  );
}

export default function ChecklistsScreen() {
  const router = useRouter();
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates, isRefetching } = useChecklistTemplates();
  const { data: progress = [], isLoading: progressLoading } = useMyChecklistProgress();
  const createChecklist = useCreateChecklist();

  const isLoading = templatesLoading || progressLoading;

  const getProgressForTemplate = (templateId: string) =>
    progress.find((p) => p.template_id === templateId);

  const handleStart = (templateId: string) => {
    createChecklist.mutate(templateId, {
      onSuccess: (data) => {
        router.push(`/checklists/${data.id}`);
      },
    });
  };

  const handleOpen = (templateId: string) => {
    const existing = getProgressForTemplate(templateId);
    if (existing) {
      router.push(`/checklists/${existing.id}`);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-navy pt-14 pb-5 px-5">
          <Text className="text-2xl font-bold text-white">Checklists</Text>
        </View>
        <LoadingSpinner message="Loading checklists..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-navy pt-14 pb-5 px-5">
        <Text className="text-2xl font-bold text-white">Checklists</Text>
        <Text className="text-sm text-blue-200 mt-1">Track your move-in and move-out tasks</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetchTemplates}
            tintColor={COLORS.primary}
          />
        }
      >
        {templates.length === 0 ? (
          <View className="items-center py-16 px-8">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
              <Ionicons name="checkbox-outline" size={32} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-1">No Checklists</Text>
            <Text className="text-gray-500 text-sm text-center">
              Checklists will be available when set up by management.
            </Text>
          </View>
        ) : (
          templates.map((template) => (
            <ChecklistCard
              key={template.id}
              template={template}
              userChecklist={getProgressForTemplate(template.id)}
              onStart={() => handleStart(template.id)}
              onOpen={() => handleOpen(template.id)}
              isCreating={createChecklist.isPending}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
