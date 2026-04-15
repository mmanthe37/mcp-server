import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch';
import { haptics } from '@/lib/haptics';
import { COLORS } from '@/lib/constants';
import { Avatar } from '@/components/ui/Avatar';

const RECENT_SEARCHES_KEY = '@legends/recent_searches';
const MAX_RECENT = 10;

const CATEGORY_META: Record<
  SearchResult['type'],
  { icon: string; label: string; emoji: string }
> = {
  person: { icon: 'people', label: 'People', emoji: '👥' },
  post: { icon: 'document-text', label: 'Posts', emoji: '📝' },
  event: { icon: 'calendar', label: 'Events', emoji: '📅' },
  listing: { icon: 'cart', label: 'Listings', emoji: '🛒' },
  place: { icon: 'location', label: 'Places', emoji: '📍' },
};

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { results, isSearching, totalResults } = useGlobalSearch(query);

  useEffect(() => {
    AsyncStorage.getItem(RECENT_SEARCHES_KEY).then((stored) => {
      if (stored) setRecentSearches(JSON.parse(stored));
    });
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const saveRecentSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [
        trimmed,
        ...recentSearches.filter((s) => s !== trimmed),
      ].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    },
    [recentSearches],
  );

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  }, []);

  const handleResultPress = useCallback(
    (item: SearchResult) => {
      haptics.light();
      saveRecentSearch(query);
      Keyboard.dismiss();
      router.push(item.route as any);
    },
    [query, router, saveRecentSearch],
  );

  const handleRecentPress = useCallback(
    (term: string) => {
      haptics.selection();
      setQuery(term);
    },
    [],
  );

  const allResults: { type: SearchResult['type']; data: SearchResult[] }[] = [
    { type: 'person', data: results.people },
    { type: 'post', data: results.posts },
    { type: 'event', data: results.events },
    { type: 'listing', data: results.listings },
    { type: 'place', data: results.places },
  ].filter((section) => section.data.length > 0);

  const renderResultItem = (item: SearchResult) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleResultPress(item)}
      className="flex-row items-center px-5 py-3 border-b border-gray-50 dark:border-gray-800"
      activeOpacity={0.7}
    >
      {item.type === 'person' ? (
        <Avatar name={item.title} size="sm" />
      ) : (
        <View className="w-8 h-8 rounded-full bg-primary-50 dark:bg-gray-700 items-center justify-center">
          <Ionicons
            name={CATEGORY_META[item.type].icon as any}
            size={16}
            color={COLORS.primary}
          />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text
          className="text-base text-gray-900 dark:text-white"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        {item.subtitle ? (
          <Text
            className="text-sm text-gray-500 dark:text-gray-400"
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900" edges={['top']}>
      {/* Search Header */}
      <View className="flex-row items-center px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2.5">
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            ref={inputRef}
            className="flex-1 ml-2 text-base text-gray-900 dark:text-white"
            placeholder="Search posts, events, people..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => saveRecentSearch(query)}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} className="p-1">
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {query.trim().length === 0 ? (
        <View className="flex-1 px-5 pt-4">
          {recentSearches.length > 0 && (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Recent Searches
                </Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text className="text-sm text-primary font-medium">
                    Clear
                  </Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((term) => (
                <TouchableOpacity
                  key={term}
                  onPress={() => handleRecentPress(term)}
                  className="flex-row items-center py-2.5"
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={18} color="#9ca3af" />
                  <Text className="ml-3 text-base text-gray-700 dark:text-gray-300 flex-1">
                    {term}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#d1d5db" />
                </TouchableOpacity>
              ))}
            </>
          )}

          {recentSearches.length === 0 && (
            <View className="flex-1 items-center justify-center pb-20">
              <Ionicons name="search" size={48} color="#d1d5db" />
              <Text className="text-gray-400 dark:text-gray-500 text-base mt-3">
                Search your community
              </Text>
            </View>
          )}
        </View>
      ) : isSearching ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400 dark:text-gray-500 text-base">
            Searching...
          </Text>
        </View>
      ) : totalResults === 0 ? (
        <View className="flex-1 items-center justify-center pb-20">
          <Ionicons name="search" size={48} color="#d1d5db" />
          <Text className="text-gray-500 dark:text-gray-400 text-base mt-3">
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={allResults}
          keyExtractor={(item) => item.type}
          renderItem={({ item: section }) => (
            <View>
              <View className="px-5 pt-4 pb-2 bg-gray-50 dark:bg-gray-900">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {CATEGORY_META[section.type].emoji}{' '}
                  {CATEGORY_META[section.type].label}
                </Text>
              </View>
              {section.data.map(renderResultItem)}
            </View>
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
