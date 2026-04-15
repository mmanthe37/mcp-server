import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '@/lib/constants';

interface MoreMenuProps {
  visible: boolean;
  onClose: () => void;
}

const MENU_ITEMS: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  color: string;
}[] = [
  { icon: 'cart-outline', label: 'Marketplace', route: '/(tabs)/market', color: '#10b981' },
  { icon: 'compass-outline', label: 'Discover', route: '/discover', color: '#3b82f6' },
  { icon: 'people-outline', label: 'Groups', route: '/groups', color: '#8b5cf6' },
  { icon: 'build-outline', label: 'Services', route: '/services', color: '#f59e0b' },
  { icon: 'checkbox-outline', label: 'Checklists', route: '/checklists', color: '#06b6d4' },
  { icon: 'call-outline', label: 'Emergency Contacts', route: '/emergency', color: '#ef4444' },
  { icon: 'trophy-outline', label: 'Rewards & Badges', route: '/rewards', color: '#f59e0b' },
  { icon: 'settings-outline', label: 'Settings', route: '/settings/theme', color: '#6b7280' },
];

export function MoreMenu({ visible, onClose }: MoreMenuProps) {
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

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 150);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
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
          className="bg-white dark:bg-gray-800 rounded-t-3xl pt-4 pb-10 max-h-[80%]"
          style={{ transform: [{ translateY }] }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 mb-2">
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              More
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 items-center justify-center"
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Handle */}
          <View className="items-center mb-3">
            <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          </View>

          <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => handleNavigate(item.route)}
                className={`flex-row items-center py-3.5 ${
                  index < MENU_ITEMS.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
                activeOpacity={0.7}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3.5"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Ionicons name={item.icon} size={20} color={item.color} />
                </View>
                <Text className="flex-1 text-base font-medium text-gray-800 dark:text-gray-100">
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
