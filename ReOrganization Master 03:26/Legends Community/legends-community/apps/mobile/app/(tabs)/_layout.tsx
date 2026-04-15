import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/lib/constants';
import { NotificationBell } from '@/components/features/notifications/NotificationBell';
import { CreateActionSheet } from '@/components/navigation/CreateActionSheet';
import { MoreMenu } from '@/components/navigation/MoreMenu';

export default function TabLayout() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const headerRight = () => (
    <View className="flex-row items-center mr-2 gap-2">
      <TouchableOpacity
        onPress={() => router.push('/search')}
        className="p-1"
        activeOpacity={0.7}
        accessibilityRole="search"
        accessibilityLabel="Search community"
      >
        <Ionicons name="search" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setShowMore(true)}
        className="p-1"
        activeOpacity={0.7}
      >
        <Ionicons name="menu" size={22} color={COLORS.white} />
      </TouchableOpacity>
      <NotificationBell color={COLORS.white} size={22} />
    </View>
  );

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: COLORS.navy,
            borderTopWidth: 0,
            height: 88,
            paddingBottom: 28,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          headerStyle: {
            backgroundColor: COLORS.primary,
          },
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            fontWeight: '700',
          },
          headerRight,
          tabBarActiveTintColor: COLORS.white,
          tabBarInactiveTintColor: '#8ca3b8',
        }}
      >
        <Tabs.Screen
          name="wall"
          options={{
            title: 'Home',
            headerTitle: 'Community Wall',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            headerTitle: 'Events',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="create"
          options={{
            title: '',
            tabBarIcon: () => (
              <View
                className="w-14 h-14 rounded-full bg-primary items-center justify-center -mt-5"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 6,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={30} color={COLORS.white} />
              </View>
            ),
            tabBarLabel: () => null,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowCreate(true);
            },
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            headerTitle: 'Messages',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerTitle: 'My Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        {/* Hide market tab from the bar — accessible via More Menu */}
        <Tabs.Screen
          name="market"
          options={{
            href: null,
            title: 'Market',
            headerTitle: 'Marketplace',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <CreateActionSheet visible={showCreate} onClose={() => setShowCreate(false)} />
      <MoreMenu visible={showMore} onClose={() => setShowMore(false)} />
    </>
  );
}
