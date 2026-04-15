import React, { useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { emergencyContactsApi } from '@legends/shared/src/api/communityApi';
import type { EmergencyContact } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const CATEGORY_CONFIG: Record<string, { emoji: string; color: string; bg: string; border: string }> = {
  emergency: { emoji: '🚨', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  property: { emoji: '🏢', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  medical: { emoji: '🏥', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  utilities: { emoji: '⚡', color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  law_enforcement: { emoji: '👮', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const CATEGORY_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  property: 'Property',
  medical: 'Medical',
  utilities: 'Utilities',
  law_enforcement: 'Law Enforcement',
};

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function ContactCard({ contact }: { contact: EmergencyContact }) {
  const config = CATEGORY_CONFIG[contact.category] ?? CATEGORY_CONFIG.property;

  const handleCall = useCallback(() => {
    const url = `tel:${contact.phone.replace(/\D/g, '')}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Cannot Make Call', `Please dial ${contact.phone} manually.`);
      }
    });
  }, [contact.phone]);

  return (
    <TouchableOpacity
      onPress={handleCall}
      activeOpacity={0.7}
      className={`bg-white rounded-2xl p-4 mb-3 border ${config.border} shadow-sm`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-gray-900">{contact.name}</Text>
          <Text className="text-xl font-bold text-primary mt-1">{formatPhone(contact.phone)}</Text>
          {contact.description && (
            <Text className="text-sm text-gray-500 mt-1">{contact.description}</Text>
          )}
        </View>
        <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
          <Ionicons name="call" size={22} color={COLORS.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface Section {
  title: string;
  emoji: string;
  data: EmergencyContact[];
}

export default function EmergencyScreen() {
  const {
    data: contacts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: async () => {
      const result = await emergencyContactsApi.getAll(supabase);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
  });

  const sections: Section[] = React.useMemo(() => {
    const grouped: Record<string, EmergencyContact[]> = {};
    contacts.forEach((c) => {
      if (!grouped[c.category]) grouped[c.category] = [];
      grouped[c.category].push(c);
    });

    const order = ['emergency', 'property', 'medical', 'utilities', 'law_enforcement'];
    return order
      .filter((cat) => grouped[cat]?.length)
      .map((cat) => ({
        title: CATEGORY_LABELS[cat] ?? cat,
        emoji: CATEGORY_CONFIG[cat]?.emoji ?? '📞',
        data: grouped[cat],
      }));
  }, [contacts]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        <View className="bg-red-600 pt-14 pb-5 px-5">
          <Text className="text-2xl font-bold text-white">Emergency Contacts</Text>
        </View>
        <LoadingSpinner message="Loading contacts..." />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-red-600 pt-14 pb-5 px-5">
        <Text className="text-2xl font-bold text-white">Emergency Contacts</Text>
        <Text className="text-sm text-red-100 mt-1">Legends Winter Springs</Text>
      </View>

      {/* 911 Banner */}
      <View className="bg-red-50 border-b border-red-200 px-5 py-3">
        <View className="flex-row items-center">
          <Text className="text-lg mr-2">🚨</Text>
          <Text className="text-sm font-semibold text-red-700 flex-1">
            In an emergency, always call 911 first
          </Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ContactCard contact={item} />}
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center px-1 pt-5 pb-2">
            <Text className="text-lg mr-2">{section.emoji}</Text>
            <Text className="text-base font-bold text-gray-800">{section.title}</Text>
          </View>
        )}
        contentContainerClassName="px-4 pb-24"
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View className="items-center py-16 px-8">
            <View className="w-16 h-16 rounded-full bg-red-50 items-center justify-center mb-4">
              <Ionicons name="call-outline" size={32} color={COLORS.error} />
            </View>
            <Text className="text-lg font-semibold text-gray-900 mb-1">No Contacts Available</Text>
            <Text className="text-gray-500 text-sm text-center">
              Emergency contacts will be added by management.
            </Text>
          </View>
        }
      />
    </View>
  );
}
