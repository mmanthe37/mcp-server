import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';

interface CreateActionSheetProps {
  visible: boolean;
  onClose: () => void;
}

const ACTIONS = [
  {
    icon: 'create-outline' as const,
    label: 'New Post',
    description: 'Share with your community',
    route: '/post/create' as const,
    color: '#3b82f6',
  },
  {
    icon: 'calendar-outline' as const,
    label: 'New Event',
    description: 'Organize a community event',
    route: '/event/create' as const,
    color: '#8b5cf6',
  },
  {
    icon: 'pricetag-outline' as const,
    label: 'New Listing',
    description: 'Sell or share an item',
    route: '/listing/create' as const,
    color: '#10b981',
  },
  {
    icon: 'stats-chart-outline' as const,
    label: 'New Poll',
    description: 'Ask the community',
    route: '/post/create' as const,
    color: '#f59e0b',
  },
];

export function CreateActionSheet({ visible, onClose }: CreateActionSheetProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const handleAction = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 150);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <Pressable onPress={onClose} className="absolute inset-0">
          <Animated.View
            className="flex-1 bg-black"
            style={{ opacity: backdropOpacity }}
          />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          className="bg-white dark:bg-gray-800 rounded-t-3xl px-5 pt-4 pb-10"
          style={{ transform: [{ translateY }] }}
        >
          {/* Handle */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </View>

          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Create Something New
          </Text>

          {ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => handleAction(action.route)}
              className="flex-row items-center py-3.5 border-b border-gray-100 dark:border-gray-700"
              activeOpacity={0.7}
            >
              <View
                className="w-11 h-11 rounded-full items-center justify-center mr-3.5"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">
                  {action.label}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {action.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          ))}

          {/* Cancel */}
          <TouchableOpacity
            onPress={onClose}
            className="mt-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 items-center"
            activeOpacity={0.7}
          >
            <Text className="text-base font-semibold text-gray-600 dark:text-gray-300">
              Cancel
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}
