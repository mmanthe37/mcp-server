import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/providers/AuthProvider';
import { usePet, useUpdatePet, useDeletePet } from '@/hooks/usePets';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  fish: '🐟',
  reptile: '🦎',
  other: '🐾',
};

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: pet, isLoading, refetch, isRefetching } = usePet(id!);
  const updatePet = useUpdatePet();
  const deletePet = useDeletePet();

  const isOwner = user?.id === pet?.owner_id;
  const emoji = SPECIES_EMOJI[pet?.species ?? 'other'] ?? '🐾';

  const handleToggleLost = () => {
    if (!pet) return;
    const newLost = !pet.is_lost;
    updatePet.mutate({
      id: pet.id,
      updates: {
        is_lost: newLost,
        last_seen_at: newLost ? new Date().toISOString() : null,
      },
    });
  };

  const handleDelete = () => {
    if (!pet) return;
    Alert.alert('Delete Pet', `Remove ${pet.name} from your profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePet.mutate(pet.id, {
            onSuccess: () => router.back(),
          });
        },
      },
    ]);
  };

  const handleContactOwner = () => {
    if (!pet?.owner) return;
    router.push(`/profile/${pet.owner_id}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <LoadingSpinner message="Loading pet..." />
      </View>
    );
  }

  if (!pet) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Pet Not Found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-primary font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-navy pt-14 pb-5 px-5 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white flex-1">{pet.name}</Text>
        {isOwner && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        {/* Lost Banner */}
        {pet.is_lost && (
          <View className="bg-red-500 px-5 py-3">
            <View className="flex-row items-center">
              <Text className="text-lg mr-2">🚨</Text>
              <View className="flex-1">
                <Text className="text-sm font-bold text-white">LOST PET</Text>
                {pet.last_seen_location && (
                  <Text className="text-xs text-red-100">
                    Last seen: {pet.last_seen_location}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Photo */}
        <View className="items-center pt-6 pb-4">
          {pet.photo_url ? (
            <Image
              source={{ uri: pet.photo_url }}
              className="w-32 h-32 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-32 h-32 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-5xl">{emoji}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="px-5">
          <Text className="text-2xl font-bold text-gray-900 text-center">{pet.name}</Text>
          <Text className="text-base text-gray-500 text-center mt-1">
            {pet.breed ? `${pet.breed} • ${pet.species}` : pet.species}
          </Text>

          {/* Owner info */}
          {pet.owner && (
            <TouchableOpacity
              onPress={handleContactOwner}
              className="flex-row items-center justify-center mt-3 py-2"
            >
              <Ionicons name="person-circle-outline" size={18} color={COLORS.gray[500]} />
              <Text className="text-sm text-gray-500 ml-1.5">
                {pet.owner.display_name}
                {pet.owner.unit_number ? ` • Unit ${pet.owner.unit_number}` : ''}
              </Text>
            </TouchableOpacity>
          )}

          {/* Description */}
          {pet.description && (
            <View className="mt-5 bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-sm font-semibold text-gray-700 mb-1">About</Text>
              <Text className="text-sm text-gray-600 leading-5">{pet.description}</Text>
            </View>
          )}

          {/* Owner Actions */}
          {isOwner && (
            <View className="mt-6 gap-3">
              <Button
                title={pet.is_lost ? '✅ Mark as Found' : '🚨 Mark as Lost'}
                onPress={handleToggleLost}
                variant={pet.is_lost ? 'primary' : 'outline'}
                loading={updatePet.isPending}
              />
            </View>
          )}

          {/* Contact owner (if not owner and pet is lost) */}
          {!isOwner && pet.is_lost && (
            <View className="mt-6">
              <Button
                title="Contact Owner"
                onPress={handleContactOwner}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
