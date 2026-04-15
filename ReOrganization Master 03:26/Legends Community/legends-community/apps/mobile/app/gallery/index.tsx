import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { isStaff, formatRelativeTime } from '@legends/shared';
import { photoAlbumsApi } from '@legends/shared/src/api/communityApi';
import type { PhotoAlbum } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

function AlbumCard({ album, onPress }: { album: PhotoAlbum; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3">
        <View className="flex-row">
          {album.cover_photo_url ? (
            <Image
              source={{ uri: album.cover_photo_url }}
              className="w-20 h-20 rounded-xl bg-gray-200 mr-3"
            />
          ) : (
            <View className="w-20 h-20 rounded-xl bg-primary/10 items-center justify-center mr-3">
              <Ionicons name="images" size={28} color={COLORS.primary} />
            </View>
          )}
          <View className="flex-1 justify-center">
            <Text className="text-base font-bold text-gray-900">{album.title}</Text>
            {album.description && (
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {album.description}
              </Text>
            )}
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="images-outline" size={14} color={COLORS.gray[400]} />
              <Text className="text-xs text-gray-400 ml-1">
                {album.photo_count} photo{album.photo_count !== 1 ? 's' : ''}
              </Text>
              <Text className="text-xs text-gray-300 mx-2">•</Text>
              <Text className="text-xs text-gray-400">
                {formatRelativeTime(album.created_at)}
              </Text>
            </View>
          </View>
          <View className="justify-center">
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray[300]} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function GalleryScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const canCreate = profile?.role && isStaff(profile.role);

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const {
    data: albums = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['photo-albums'],
    queryFn: async () => {
      const result = await photoAlbumsApi.getAll(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  const createAlbum = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Not authenticated');
      const result = await photoAlbumsApi.create(supabase, {
        title: title.trim(),
        description: description.trim() || undefined,
        created_by: profile.id,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['photo-albums'] });
      setModalVisible(false);
      setTitle('');
      setDescription('');
      router.push(`/gallery/${data.id}`);
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleCreate = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter an album title.');
      return;
    }
    createAlbum.mutate();
  }, [title, createAlbum]);

  const renderItem = useCallback(
    ({ item }: { item: PhotoAlbum }) => (
      <AlbumCard album={item} onPress={() => router.push(`/gallery/${item.id}`)} />
    ),
    [router],
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View className="items-center py-16 px-8">
        <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
          <Ionicons name="images-outline" size={32} color={COLORS.primary} />
        </View>
        <Text className="text-lg font-semibold text-gray-900 mb-1">No Albums Yet</Text>
        <Text className="text-gray-500 text-sm text-center">
          Community photo albums will appear here.
        </Text>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-navy pt-14 pb-5 px-5">
        <Text className="text-2xl font-bold text-white">📸 Photo Gallery</Text>
        <Text className="text-sm text-blue-200 mt-1">Legends Winter Springs</Text>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading albums..." />
      ) : (
        <FlatList
          data={albums}
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
      {canCreate && (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}

      {/* Create Album Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View className="bg-white rounded-t-3xl px-5 pb-10 pt-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900">Create Album</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1.5">Title *</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
              placeholder="Album title"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
            />

            <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
              placeholder="Optional description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />

            <Button
              title="Create Album"
              onPress={handleCreate}
              loading={createAlbum.isPending}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
