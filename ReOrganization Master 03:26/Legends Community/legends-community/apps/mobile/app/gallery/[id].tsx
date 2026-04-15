import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { photoAlbumsApi } from '@legends/shared/src/api/communityApi';
import type { AlbumPhoto } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PhotoGrid } from '@/components/features/gallery/PhotoGrid';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function AlbumDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const {
    data: album,
    isLoading: albumLoading,
    refetch: refetchAlbum,
  } = useQuery({
    queryKey: ['photo-album', id],
    queryFn: async () => {
      const result = await photoAlbumsApi.getById(supabase, id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });

  const {
    data: photos = [],
    isLoading: photosLoading,
    refetch: refetchPhotos,
    isRefetching,
  } = useQuery({
    queryKey: ['album-photos', id],
    queryFn: async () => {
      const result = await photoAlbumsApi.getPhotos(supabase, id!);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    enabled: !!id,
  });

  const addPhoto = useMutation({
    mutationFn: async (photoUrl: string) => {
      if (!user || !id) throw new Error('Not authenticated');
      const result = await photoAlbumsApi.addPhoto(supabase, {
        album_id: id,
        photo_url: photoUrl,
        uploaded_by: user.id,
      });
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['album-photos', id] });
      queryClient.invalidateQueries({ queryKey: ['photo-album', id] });
      queryClient.invalidateQueries({ queryKey: ['photo-albums'] });
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleAddPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addPhoto.mutate(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not access photo library');
    }
  };

  const handlePhotoPress = useCallback((index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  }, []);

  const handleRefresh = useCallback(() => {
    refetchAlbum();
    refetchPhotos();
  }, [refetchAlbum, refetchPhotos]);

  const isLoading = albumLoading || photosLoading;

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-navy pt-14 pb-5 px-5 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Album</Text>
        </View>
        <LoadingSpinner message="Loading album..." />
      </View>
    );
  }

  if (!album) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Album Not Found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentPhoto = photos[viewerIndex];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy pt-14 pb-5 px-5">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">{album.title}</Text>
            <Text className="text-sm text-blue-200 mt-0.5">
              {photos.length} photo{photos.length !== 1 ? 's' : ''}
            </Text>
          </View>
          {user && (
            <TouchableOpacity
              onPress={handleAddPhoto}
              className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center"
            >
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text className="text-xs font-semibold text-white ml-1">Add</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {album.description && (
        <View className="px-4 py-3 bg-white border-b border-gray-100">
          <Text className="text-sm text-gray-600">{album.description}</Text>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        <PhotoGrid photos={photos} onPhotoPress={handlePhotoPress} />
      </ScrollView>

      {/* Full-screen photo viewer */}
      <Modal visible={viewerVisible} animationType="fade" transparent>
        <View className="flex-1 bg-black">
          <View className="flex-row items-center justify-between px-5 pt-14 pb-3">
            <TouchableOpacity onPress={() => setViewerVisible(false)}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-sm font-medium">
              {viewerIndex + 1} / {photos.length}
            </Text>
            <View className="w-7" />
          </View>

          <View className="flex-1 items-center justify-center">
            {currentPhoto && (
              <Image
                source={{ uri: currentPhoto.photo_url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                resizeMode="contain"
              />
            )}
          </View>

          {currentPhoto?.caption && (
            <View className="px-5 pb-10">
              <Text className="text-white text-sm text-center">{currentPhoto.caption}</Text>
            </View>
          )}

          {/* Navigation arrows */}
          <View className="absolute top-0 bottom-0 left-0 right-0 flex-row items-center justify-between px-3 pointer-events-box-none">
            {viewerIndex > 0 && (
              <TouchableOpacity
                onPress={() => setViewerIndex((i) => i - 1)}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={24} color="white" />
              </TouchableOpacity>
            )}
            <View className="flex-1" />
            {viewerIndex < photos.length - 1 && (
              <TouchableOpacity
                onPress={() => setViewerIndex((i) => i + 1)}
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
