import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';

const SERVICES = [
  {
    icon: 'build-outline' as const,
    label: 'Maintenance Requests',
    description: 'Submit and track repair requests',
    route: '/services/maintenance',
    color: '#f59e0b',
  },
  {
    icon: 'calendar-outline' as const,
    label: 'Amenity Reservations',
    description: 'Book clubhouse, pool & more',
    route: '/services/reservations',
    color: '#3b82f6',
  },
  {
    icon: 'ticket-outline' as const,
    label: 'Guest Passes',
    description: 'Create passes for visitors',
    route: '/services/guest-passes',
    color: '#8b5cf6',
  },
  {
    icon: 'cube-outline' as const,
    label: 'Package Tracking',
    description: 'Track your deliveries',
    route: '/services/packages',
    color: '#10b981',
  },
  {
    icon: 'car-outline' as const,
    label: 'Parking',
    description: 'Manage parking permits',
    route: '/services/parking',
    color: '#6b7280',
  },
];

export default function ServicesScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Services',
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Access property services and management tools
          </Text>

          <View className="flex-row flex-wrap -mx-1.5">
            {SERVICES.map((service) => (
              <View key={service.label} className="w-1/2 px-1.5 mb-3">
                <TouchableOpacity
                  onPress={() => router.push(service.route as any)}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 min-h-[140px]"
                  activeOpacity={0.7}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                  }}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <Ionicons name={service.icon} size={22} color={service.color} />
                  </View>
                  <Text className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {service.label}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    {service.description}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
