import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';

export interface Feature {
  icon: string;
  label: string;
}

interface OnboardingSlideProps {
  emoji: string;
  title: string;
  description: string;
  features: Feature[];
}

export function OnboardingSlide({
  emoji,
  title,
  description,
  features,
}: OnboardingSlideProps) {
  const { width } = useWindowDimensions();

  return (
    <View className="flex-1 items-center justify-center px-8" style={{ width }}>
      <Text className="text-7xl mb-6">{emoji}</Text>
      <Text className="text-2xl font-bold text-navy dark:text-white text-center mb-3">
        {title}
      </Text>
      <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-8 leading-6">
        {description}
      </Text>
      <View className="w-full max-w-xs">
        {features.map((feature) => (
          <View
            key={feature.label}
            className="flex-row items-center bg-primary-50 dark:bg-gray-800 rounded-xl px-4 py-3 mb-3"
          >
            <Text className="text-xl mr-3">{feature.icon}</Text>
            <Text className="text-base font-medium text-gray-800 dark:text-gray-200">
              {feature.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
