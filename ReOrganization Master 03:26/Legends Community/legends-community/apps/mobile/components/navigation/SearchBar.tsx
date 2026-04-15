import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = '' }: SearchBarProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        haptics.light();
        router.push('/search');
      }}
      className={`flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 ${className}`}
      accessibilityRole="search"
      accessibilityLabel="Search posts, events, people"
    >
      <Ionicons name="search" size={18} color="#9ca3af" />
      <Text className="text-gray-400 dark:text-gray-500 ml-2 text-base flex-1">
        Search posts, events, people...
      </Text>
    </Pressable>
  );
}
