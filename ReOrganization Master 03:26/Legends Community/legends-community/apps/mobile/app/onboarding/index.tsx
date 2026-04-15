import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingSlide, type Feature } from '@/components/ui/OnboardingSlide';
import { haptics } from '@/lib/haptics';
import { COLORS } from '@/lib/constants';

export const ONBOARDING_COMPLETE_KEY = '@legends/onboarding_complete';

interface Slide {
  id: string;
  emoji: string;
  title: string;
  description: string;
  features: Feature[];
}

const slides: Slide[] = [
  {
    id: 'welcome',
    emoji: '🏠',
    title: 'Welcome to\nLegends Community',
    description:
      'Your all-in-one community hub for Legends Winter Springs. Connect, share, and thrive together.',
    features: [
      { icon: '🤝', label: 'Meet your neighbors' },
      { icon: '🔔', label: 'Stay in the loop' },
      { icon: '⭐', label: 'Build community together' },
    ],
  },
  {
    id: 'connected',
    emoji: '💬',
    title: 'Stay Connected',
    description:
      'Everything you need to stay connected with your community — all in one place.',
    features: [
      { icon: '📰', label: 'Community Wall — share updates' },
      { icon: '📅', label: 'Events — never miss a gathering' },
      { icon: '💬', label: 'Messaging — chat with neighbors' },
    ],
  },
  {
    id: 'hub',
    emoji: '🚀',
    title: 'Your Community Hub',
    description:
      'From the marketplace to local services and rewards — everything at your fingertips.',
    features: [
      { icon: '🛒', label: 'Marketplace — buy & sell locally' },
      { icon: '🔧', label: 'Services — find local help' },
      { icon: '🎁', label: 'Rewards — earn community perks' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const completeOnboarding = useCallback(async () => {
    haptics.success();
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    router.replace('/(auth)/login');
  }, [router]);

  const handleSkip = useCallback(async () => {
    haptics.light();
    await completeOnboarding();
  }, [completeOnboarding]);

  const handleNext = useCallback(() => {
    haptics.light();
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  }, [currentIndex, completeOnboarding]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      {/* Skip */}
      <View className="flex-row justify-end px-5 pt-2">
        {!isLastSlide ? (
          <TouchableOpacity onPress={handleSkip} className="py-2 px-3">
            <Text className="text-base text-gray-400 dark:text-gray-500 font-medium">
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View className="py-2 px-3">
            <Text className="text-base text-transparent">Skip</Text>
          </View>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <OnboardingSlide
            emoji={item.emoji}
            title={item.title}
            description={item.description}
            features={item.features}
          />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Bottom controls */}
      <View className="px-8 pb-6">
        {/* Dot indicators */}
        <View className="flex-row items-center justify-center mb-6">
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              className={`h-2 rounded-full mx-1 ${
                index === currentIndex
                  ? 'w-6 bg-primary'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </View>

        {/* Action button */}
        <TouchableOpacity
          onPress={handleNext}
          className="bg-primary rounded-2xl py-4 items-center"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get Started' : 'Next'}
        >
          <Text className="text-white text-lg font-bold">
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
