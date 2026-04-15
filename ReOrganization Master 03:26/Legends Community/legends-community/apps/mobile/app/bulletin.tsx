import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { isStaff, formatRelativeTime } from '@legends/shared';
import { announcementsApi } from '@legends/shared/src/api/communityApi';
import type { Announcement } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const PRIORITY_CONFIG = {
  urgent: { bg: 'bg-red-100', text: 'text-red-700', label: 'Urgent', icon: 'alert-circle' as const },
  normal: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Announcement', icon: 'megaphone' as const },
  info: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Info', icon: 'information-circle' as const },
};

function AnnouncementCard({ item }: { item: Announcement }) {
  const config = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.info;

  return (
    <Card className="mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          {item.is_pinned && <Text className="mr-1.5">📌</Text>}
          <View className={`flex-row items-center px-2 py-1 rounded-full ${config.bg}`}>
            <Ionicons name={config.icon} size={12} color={undefined} />
            <Text className={`text-xs font-semibold ml-1 ${config.text}`}>{config.label}</Text>
          </View>
        </View>
        <Text className="text-xs text-gray-400">{formatRelativeTime(item.created_at)}</Text>
      </View>

      <Text className="text-base font-bold text-gray-900 mb-1">{item.title}</Text>
      <Text className="text-sm text-gray-600 leading-5" numberOfLines={4}>
        {item.body}
      </Text>

      {item.author && (
        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
          <Ionicons name="person-circle-outline" size={16} color={COLORS.gray[400]} />
          <Text className="text-xs text-gray-400 ml-1">{item.author.display_name}</Text>
        </View>
      )}
    </Card>
  );
}

export default function BulletinScreen() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const canPost = profile?.role && isStaff(profile.role);

  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPriority, setNewPriority] = useState<'urgent' | 'normal' | 'info'>('normal');

  const {
    data: announcements = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const result = await announcementsApi.getAll(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Not authenticated');
      const result = await announcementsApi.create(supabase, {
        title: newTitle.trim(),
        body: newBody.trim(),
        priority: newPriority,
        author_id: profile.id,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      setModalVisible(false);
      setNewTitle('');
      setNewBody('');
      setNewPriority('normal');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!newTitle.trim() || !newBody.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both title and body.');
      return;
    }
    createMutation.mutate();
  }, [newTitle, newBody, createMutation]);

  const renderItem = useCallback(
    ({ item }: { item: Announcement }) => <AnnouncementCard item={item} />,
    [],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="items-center py-16 px-8">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="megaphone-outline" size={32} color={COLORS.primary} />
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-1">No Announcements</Text>
        <Text className="text-gray-500 text-sm text-center">
          Community announcements will appear here.
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy pt-14 pb-5 px-5">
        <Text className="text-2xl font-bold text-white">Community Bulletin</Text>
        <Text className="text-sm text-blue-200 mt-1">Legends Winter Springs</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading announcements..." />
      ) : (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
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
      )}

      {/* FAB for staff */}
      {canPost && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* New Announcement Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-4 border-b border-gray-100">
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text className="text-base text-gray-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">New Announcement</Text>
            <View className="w-14" />
          </View>

          <ScrollView className="flex-1 px-5 pt-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5">Title</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
              placeholder="Announcement title..."
              placeholderTextColor="#9ca3af"
              value={newTitle}
              onChangeText={setNewTitle}
            />

            <Text className="text-sm font-medium text-gray-700 mb-1.5">Message</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
              placeholder="Write your announcement..."
              placeholderTextColor="#9ca3af"
              value={newBody}
              onChangeText={setNewBody}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{ minHeight: 120 }}
            />

            <Text className="text-sm font-medium text-gray-700 mb-2">Priority</Text>
            <View className="flex-row gap-2 mb-6">
              {(['info', 'normal', 'urgent'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setNewPriority(p)}
                  className={`flex-1 py-2.5 rounded-xl items-center border ${
                    newPriority === p ? 'border-primary bg-primary/10' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      newPriority === p ? 'text-primary' : 'text-gray-500'
                    }`}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Post Announcement"
              onPress={handleSubmit}
              loading={createMutation.isPending}
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
