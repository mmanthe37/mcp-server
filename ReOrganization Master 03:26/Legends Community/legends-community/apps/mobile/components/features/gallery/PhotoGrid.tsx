import React from 'react';
import { View, Image, TouchableOpacity, Text, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 4;
const COLUMNS = 3;

interface PhotoGridProps {
  photos: { id: string; photo_url: string; caption?: string | null }[];
  onPhotoPress?: (index: number) => void;
  containerPadding?: number;
}

export function PhotoGrid({ photos, onPhotoPress, containerPadding = 16 }: PhotoGridProps) {
  const itemSize = (SCREEN_WIDTH - containerPadding * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  if (photos.length === 0) {
    return (
      <View className="items-center py-12">
        <Text className="text-3xl mb-2">📷</Text>
        <Text className="text-sm text-gray-500">No photos yet</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap" style={{ gap: GAP }}>
      {photos.map((photo, index) => (
        <TouchableOpacity
          key={photo.id}
          onPress={() => onPhotoPress?.(index)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: photo.photo_url }}
            style={{ width: itemSize, height: itemSize }}
            className="rounded-lg bg-gray-200"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
