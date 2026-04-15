import React from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Card } from '@/components/ui/Card';
import { PetCard } from '@/components/features/pets/PetCard';
import { useMyPets, useAllPets, useLostPets } from '@/hooks/usePets';
import type { PetProfile } from '@legends/shared/src/api/communityApi';

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐕',
  cat: '🐱',
  bird: '🐦',
  fish: '🐟',
  reptile: '🦎',
  other: '🐾',
};

function LostPetCard({ pet, onPress }: { pet: PetProfile; onPress: () => void }) {
  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card className="mb-3 border-red-200 border">
        <View className="bg-red-500 px-3 py-1 rounded-lg self-start mb-2">
          <Text className="text-xs font-bold text-white">🚨 LOST</Text>
        </View>
        <View className="flex-row">
          {pet.photo_url ? (
            <Image source={{ uri: pet.photo_url }} className="w-16 h-16 rounded-xl bg-gray-200 mr-3" />
          ) : (
            <View className="w-16 h-16 rounded-xl bg-red-50 items-center justify-center mr-3">
              <Text className="text-2xl">{emoji}</Text>
            </View>
          )}
          <View className="flex-1">
            <Text className="text-base font-bold text-gray-900">{pet.name}</Text>
            <Text className="text-sm text-gray-500">
              {pet.breed ?? pet.species}
            </Text>
            {pet.last_seen_location && (
              <Text className="text-xs text-red-600 mt-1">
                📍 Last seen: {pet.last_seen_location}
              </Text>
            )}
            {pet.description && (
              <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
                {pet.description}
              </Text>
            )}
          </View>
        </View>
        {pet.owner && (
          <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
            <Ionicons name="person-circle-outline" size={14} color={COLORS.gray[400]} />
            <Text className="text-xs text-gray-400 ml-1">
              Contact: {pet.owner.display_name}
              {pet.owner.unit_number ? ` (Unit ${pet.owner.unit_number})` : ''}
            </Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

function CommunityPetCard({ pet, onPress }: { pet: PetProfile; onPress: () => void }) {
  const emoji = SPECIES_EMOJI[pet.species] ?? '🐾';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="w-[48%] mb-3"
    >
      <Card>
        <View className="items-center">
          {pet.photo_url ? (
            <Image source={{ uri: pet.photo_url }} className="w-14 h-14 rounded-full bg-gray-200 mb-2" />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary/10 items-center justify-center mb-2">
              <Text className="text-2xl">{emoji}</Text>
            </View>
          )}
          <Text className="text-sm font-bold text-gray-900 text-center" numberOfLines={1}>
            {pet.name}
          </Text>
          <Text className="text-xs text-gray-500 text-center" numberOfLines={1}>
            {pet.breed ?? pet.species}
          </Text>
          {pet.owner && (
            <Text className="text-[10px] text-gray-400 mt-1 text-center" numberOfLines={1}>
              {pet.owner.display_name}
            </Text>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function PetsScreen() {
  const router = useRouter();
  const { data: myPets = [], isLoading: myPetsLoading } = useMyPets();
  const { data: allPets = [], isLoading: allPetsLoading, refetch, isRefetching } = useAllPets();
  const { data: lostPets = [] } = useLostPets();

  const isLoading = myPetsLoading || allPetsLoading;

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-navy pt-14 pb-5 px-5">
          <Text className="text-2xl font-bold text-white">Pet Directory</Text>
        </View>
        <LoadingSpinner message="Loading pets..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-navy pt-14 pb-5 px-5">
        <Text className="text-2xl font-bold text-white">🐾 Pet Directory</Text>
        <Text className="text-sm text-blue-200 mt-1">Legends Winter Springs</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-24"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        {/* My Pets Section */}
        <View className="px-4 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-gray-900">My Pets</Text>
            <TouchableOpacity
              onPress={() => router.push('/pets/add')}
              className="flex-row items-center bg-primary/10 px-3 py-1.5 rounded-full"
            >
              <Ionicons name="add" size={16} color={COLORS.primary} />
              <Text className="text-xs font-semibold text-primary ml-1">Add Pet</Text>
            </TouchableOpacity>
          </View>

          {myPets.length === 0 ? (
            <Card className="mb-2">
              <View className="items-center py-4">
                <Text className="text-3xl mb-2">🐾</Text>
                <Text className="text-sm text-gray-500">No pets registered yet</Text>
                <TouchableOpacity
                  onPress={() => router.push('/pets/add')}
                  className="mt-2"
                >
                  <Text className="text-sm font-semibold text-primary">Add your first pet</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ) : (
            <FlatList
              data={myPets}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PetCard
                  pet={item}
                  onPress={() => router.push(`/pets/${item.id}`)}
                />
              )}
              className="mb-2"
            />
          )}
        </View>

        {/* Lost & Found Section */}
        {lostPets.length > 0 && (
          <View className="px-4 pt-2 pb-2">
            <Text className="text-base font-bold text-red-600 mb-3">
              🚨 Lost & Found
            </Text>
            {lostPets.map((pet) => (
              <LostPetCard
                key={pet.id}
                pet={pet}
                onPress={() => router.push(`/pets/${pet.id}`)}
              />
            ))}
          </View>
        )}

        {/* Community Pets Grid */}
        <View className="px-4 pt-2">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Community Pets
          </Text>
          {allPets.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-gray-500 text-sm">No community pets yet</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {allPets.map((pet) => (
                <CommunityPetCard
                  key={pet.id}
                  pet={pet}
                  onPress={() => router.push(`/pets/${pet.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
