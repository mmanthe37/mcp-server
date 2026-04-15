import React from 'react';
import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import { useWeather } from '@/hooks/useWeather';

export function WeatherWidget() {
  const { data: weather, isLoading, isError } = useWeather();

  if (isLoading) {
    return (
      <Card className="mb-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
          <View className="ml-3 flex-1">
            <View className="w-24 h-4 bg-gray-100 rounded mb-2" />
            <View className="w-16 h-3 bg-gray-100 rounded" />
          </View>
        </View>
      </Card>
    );
  }

  if (isError || !weather) {
    return null;
  }

  return (
    <Card className="mb-4">
      {/* Current weather */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Text className="text-4xl mr-3">{weather.current.icon}</Text>
          <View>
            <Text className="text-3xl font-bold text-gray-900">
              {weather.current.temp}°
            </Text>
            <Text className="text-xs text-gray-500">{weather.location}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-sm font-medium text-gray-700">
            {weather.current.condition}
          </Text>
          <Text className="text-xs text-gray-400 mt-0.5">
            H:{weather.current.high}° L:{weather.current.low}°
          </Text>
        </View>
      </View>

      {/* Forecast divider */}
      <View className="h-px bg-gray-100 my-3" />

      {/* 3-day forecast */}
      <View className="flex-row justify-around">
        {weather.forecast.map((day, idx) => (
          <View key={idx} className="items-center">
            <Text className="text-xs font-semibold text-gray-500 mb-1">{day.day}</Text>
            <Text className="text-xl mb-1">{day.icon}</Text>
            <View className="flex-row items-center">
              <Text className="text-xs font-bold text-gray-800">{day.high}°</Text>
              <Text className="text-xs text-gray-400 ml-1">{day.low}°</Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
