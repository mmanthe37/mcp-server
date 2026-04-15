import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/providers/AuthProvider';
import { COLORS, APP } from '@/lib/constants';

const ROLE_BADGE_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'gray'> = {
  admin: 'error',
  staff: 'warning',
  moderator: 'success',
  resident: 'primary',
  local_business: 'gray',
  guest: 'gray',
};

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const isStaffOrAdmin = profile?.role === 'admin' || profile?.role === 'staff';
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Resident';
  const username = profile?.username || 'username';
  const roleName = (profile?.role ?? 'resident').replace('_', ' ');
  const avatarUrl = profile?.avatar_url;

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            // handled silently
          }
        },
      },
    ]);
  };

  const quickActions = [
    {
      icon: 'cart-outline' as const,
      label: 'My Listings',
      onPress: () => router.push('/(tabs)/market'),
    },
    {
      icon: 'calendar-outline' as const,
      label: 'My Events',
      onPress: () => router.push('/(tabs)/events'),
    },
    {
      icon: 'bookmark-outline' as const,
      label: 'Saved Posts',
      onPress: () => Alert.alert('Coming Soon', 'Bookmarks will be available in a future update.'),
    },
    {
      icon: 'settings-outline' as const,
      label: 'Settings',
      onPress: () => router.push('/profile/edit'),
    },
  ];

  const settingsItems = [
    {
      icon: 'person-outline' as const,
      label: 'Edit Profile',
      onPress: () => router.push('/profile/edit'),
    },
    {
      icon: 'notifications-outline' as const,
      label: 'Notification Preferences',
      onPress: () => Alert.alert('Coming Soon', 'Notification preferences coming soon.'),
    },
    {
      icon: 'moon-outline' as const,
      label: 'Theme',
      subtitle: 'Light',
      onPress: () => router.push('/settings/theme'),
    },
    {
      icon: 'shield-outline' as const,
      label: 'Privacy & Security',
      onPress: () => Alert.alert('Coming Soon', 'Privacy settings coming soon.'),
    },
    {
      icon: 'help-circle-outline' as const,
      label: 'Help & Support',
      onPress: () => Alert.alert('Help', 'Contact management at the leasing office for support.'),
    },
    {
      icon: 'information-circle-outline' as const,
      label: 'About Legends Community',
      onPress: () =>
        Alert.alert(
          APP.communityName,
          `${APP.address}\n\nVersion 1.0.0\n\nBuilt with ❤️ for our community.`,
        ),
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        {/* Profile Header */}
        <Card className="mb-4">
          <View className="items-center py-4">
            <TouchableOpacity
              onPress={() => router.push('/profile/edit')}
              className="mb-3"
              activeOpacity={0.8}
            >
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  className="w-24 h-24 rounded-full"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
                  <Ionicons name="person" size={44} color={COLORS.white} />
                </View>
              )}
              <View className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                <Ionicons name="camera" size={14} color={COLORS.primary} />
              </View>
            </TouchableOpacity>

            <Text className="text-xl font-bold text-gray-900">{displayName}</Text>
            <Text className="text-gray-400 text-sm mt-0.5">@{username}</Text>
            <Badge
              label={roleName.charAt(0).toUpperCase() + roleName.slice(1)}
              variant={ROLE_BADGE_VARIANT[profile?.role ?? 'resident'] || 'primary'}
              className="mt-2"
            />
          </View>
        </Card>

        {/* Bio */}
        {profile?.bio ? (
          <Card className="mb-4">
            <Text className="text-gray-600 text-sm leading-5">{profile.bio}</Text>
          </Card>
        ) : null}

        {/* Stats Row */}
        <View className="flex-row mb-4">
          {[
            { label: 'Posts', value: '—' },
            { label: 'Events', value: '—' },
            { label: 'Points', value: profile?.points?.toLocaleString() ?? '0' },
          ].map((stat) => (
            <View key={stat.label} className="flex-1 items-center">
              <Card className="w-full items-center py-3">
                <Text className="text-xl font-bold text-primary">{stat.value}</Text>
                <Text className="text-xs text-gray-500 mt-1">{stat.label}</Text>
              </Card>
            </View>
          ))}
        </View>

        {/* Admin Dashboard Button */}
        {isStaffOrAdmin && (
          <TouchableOpacity
            onPress={() => router.push('/admin')}
            className="bg-navy rounded-2xl p-4 mb-4 flex-row items-center shadow-sm"
            activeOpacity={0.8}
          >
            <View className="bg-white/20 rounded-full p-2.5 mr-3">
              <Ionicons name="shield-checkmark" size={22} color={COLORS.white} />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Admin Dashboard</Text>
              <Text className="text-white/70 text-xs mt-0.5">Manage community</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View className="flex-row flex-wrap mb-4">
          {quickActions.map((action) => (
            <View key={action.label} className="w-1/2 p-1">
              <TouchableOpacity
                onPress={action.onPress}
                className="bg-white rounded-2xl p-4 items-center border border-gray-100 shadow-sm"
                activeOpacity={0.7}
              >
                <View className="bg-primary/10 rounded-full p-3 mb-2">
                  <Ionicons name={action.icon} size={22} color={COLORS.primary} />
                </View>
                <Text className="text-sm font-medium text-gray-700">{action.label}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Settings List */}
        <Card className="mb-4">
          {settingsItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center py-3.5 ${
                i > 0 ? 'border-t border-gray-100' : ''
              }`}
              activeOpacity={0.7}
            >
              <Ionicons name={item.icon} size={22} color={COLORS.gray[500]} />
              <View className="flex-1 ml-3">
                <Text className="text-gray-700 font-medium">{item.label}</Text>
                {item.subtitle && (
                  <Text className="text-gray-400 text-xs mt-0.5">{item.subtitle}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-white rounded-2xl py-4 items-center border border-red-200 mb-4"
          activeOpacity={0.7}
        >
          <Text className="text-red-500 font-semibold text-base">Sign Out</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center py-4 mb-8">
          <Text className="text-xs text-gray-400">{APP.communityName}</Text>
          <Text className="text-xs text-gray-300 mt-1">Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}
