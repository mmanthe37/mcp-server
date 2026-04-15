import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { useCreatePet } from '@/hooks/usePets';

const SPECIES_OPTIONS = [
  { value: 'dog', label: 'Dog', emoji: '🐕' },
  { value: 'cat', label: 'Cat', emoji: '🐱' },
  { value: 'bird', label: 'Bird', emoji: '🐦' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
  { value: 'reptile', label: 'Reptile', emoji: '🦎' },
  { value: 'other', label: 'Other', emoji: '🐾' },
];

export default function AddPetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const createPet = useCreatePet();

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed] = useState('');
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not access photo library');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', "Please enter your pet's name.");
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    createPet.mutate(
      {
        owner_id: user.id,
        name: name.trim(),
        species,
        breed: breed.trim() || null,
        description: description.trim() || null,
        photo_url: photoUri,
        is_lost: false,
        last_seen_location: null,
        last_seen_at: null,
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: (error) => {
          Alert.alert('Error', error.message);
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-navy pt-14 pb-5 px-5 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Add Pet</Text>
      </View>

      <ScrollView className="flex-1 px-5 pt-5" showsVerticalScrollIndicator={false}>
        {/* Photo */}
        <View className="items-center mb-6">
          <TouchableOpacity onPress={handlePickPhoto} activeOpacity={0.7}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-28 h-28 rounded-full bg-gray-200" />
            ) : (
              <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300">
                <Ionicons name="camera" size={32} color={COLORS.gray[400]} />
                <Text className="text-xs text-gray-400 mt-1">Add Photo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">Name *</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
          placeholder="Pet's name"
          placeholderTextColor="#9ca3af"
          value={name}
          onChangeText={setName}
        />

        {/* Species */}
        <Text className="text-sm font-medium text-gray-700 mb-2">Species</Text>
        <View className="flex-row flex-wrap gap-2 mb-4">
          {SPECIES_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSpecies(opt.value)}
              className={`flex-row items-center px-3 py-2 rounded-xl border ${
                species === opt.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <Text className="mr-1">{opt.emoji}</Text>
              <Text
                className={`text-sm font-medium ${
                  species === opt.value ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Breed */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">Breed</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
          placeholder="e.g., Golden Retriever"
          placeholderTextColor="#9ca3af"
          value={breed}
          onChangeText={setBreed}
        />

        {/* Description */}
        <Text className="text-sm font-medium text-gray-700 mb-1.5">Description</Text>
        <TextInput
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-6"
          placeholder="Tell us about your pet..."
          placeholderTextColor="#9ca3af"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={{ minHeight: 100 }}
        />

        <Button
          title="Save Pet"
          onPress={handleSave}
          loading={createPet.isPending}
          className="mb-8"
        />
      </ScrollView>
    </View>
  );
}
