import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';

interface PetCardProps {
  pet: {
    id: string;
    name: string;
    breed: string | null;
    photo_url: string | null;
    is_lost: boolean;
    species: string;
  };
  onPress?: () => void;
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  fish: '🐟',
  reptile: '🦎',
  other: '🐾',
};

export function PetCard({ pet, onPress }: PetCardProps) {
  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="items-center mr-4 w-24"
    >
      <View className="relative">
        {pet.photo_url ? (
          <Image
            source={{ uri: pet.photo_url }}
            className="w-16 h-16 rounded-full bg-gray-200"
          />
        ) : (
          <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-2xl">{emoji}</Text>
          </View>
        )}
        {pet.is_lost && (
          <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center">
            <Text className="text-white text-[8px] font-bold">!</Text>
          </View>
        )}
      </View>
      <Text className="text-xs font-semibold text-gray-900 mt-1.5 text-center" numberOfLines={1}>
        {pet.name}
      </Text>
      {pet.breed && (
        <Text className="text-[10px] text-gray-400 text-center" numberOfLines={1}>
          {pet.breed}
        </Text>
      )}
    </TouchableOpacity>
  );
}
