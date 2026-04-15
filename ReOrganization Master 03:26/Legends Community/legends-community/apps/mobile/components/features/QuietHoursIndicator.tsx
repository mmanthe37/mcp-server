import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { communitySettingsApi } from '@legends/shared/src/api/communityApi';
import { COLORS } from '@/lib/constants';

interface QuietHoursConfig {
  start: string;
  end: string;
  enabled: boolean;
}

function isQuietHours(config: QuietHoursConfig | null): boolean {
  if (!config?.enabled) return false;

  const now = new Date();
  const hours = now.getHours();

  const startHour = parseInt(config.start.split(':')[0], 10);
  const endHour = parseInt(config.end.split(':')[0], 10);

  // Handles overnight span (e.g., 22:00 - 08:00)
  if (startHour > endHour) {
    return hours >= startHour || hours < endHour;
  }
  return hours >= startHour && hours < endHour;
}

export function QuietHoursIndicator() {
  const [modalVisible, setModalVisible] = useState(false);
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');

  const { data: setting } = useQuery({
    queryKey: ['community-settings', 'quiet_hours'],
    queryFn: async () => {
      const result = await communitySettingsApi.get(supabase, 'quiet_hours');
      if (result.error) return null;
      return result.data?.value as QuietHoursConfig | null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const submitComplaint = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('noise_complaints').insert({
        source_unit: unit.trim() || null,
        description: description.trim(),
        reported_at: new Date().toISOString(),
      });
      if (error) {
        // Table might not exist yet; fall back to wall post
        const { error: postError } = await supabase.from('wall_posts').insert({
          type: 'alert',
          visibility: 'staff_only',
          title: 'Noise Complaint',
          body: `Unit: ${unit || 'Unknown'}\n${description}`,
          author_id: (await supabase.auth.getUser()).data.user?.id,
        });
        if (postError) throw new Error(postError.message);
      }
    },
    onSuccess: () => {
      Alert.alert('Submitted', 'Your noise complaint has been sent to staff.');
      setModalVisible(false);
      setUnit('');
      setDescription('');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = useCallback(() => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please describe the noise issue.');
      return;
    }
    submitComplaint.mutate();
  }, [description, submitComplaint]);

  const quiet = isQuietHours(setting ?? null);

  if (!quiet) return null;

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        className="flex-row items-center bg-indigo-900/20 px-3 py-1.5 rounded-full"
        activeOpacity={0.7}
      >
        <Text className="text-sm mr-1">🌙</Text>
        <Text className="text-xs font-semibold text-indigo-200">Quiet Hours</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View className="bg-white rounded-t-3xl px-5 pb-10 pt-6">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-lg font-bold text-gray-900">Report Noise</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[400]} />
              </TouchableOpacity>
            </View>

            <View className="bg-indigo-50 rounded-xl p-3 mb-4 flex-row items-center">
              <Text className="text-lg mr-2">🌙</Text>
              <Text className="text-sm text-indigo-700 font-medium flex-1">
                Quiet hours are currently active ({setting?.start ?? '10:00 PM'} – {setting?.end ?? '8:00 AM'})
              </Text>
            </View>

            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Unit Number (optional)
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-4"
              placeholder="e.g., 204"
              placeholderTextColor="#9ca3af"
              value={unit}
              onChangeText={setUnit}
              keyboardType="default"
            />

            <Text className="text-sm font-medium text-gray-700 mb-1.5">
              Description
            </Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 mb-5"
              placeholder="Describe the noise..."
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{ minHeight: 80 }}
            />

            <TouchableOpacity
              onPress={handleSubmit}
              className="bg-primary py-3.5 rounded-xl items-center"
              activeOpacity={0.8}
              disabled={submitComplaint.isPending}
            >
              <Text className="text-white font-semibold text-base">
                {submitComplaint.isPending ? 'Submitting...' : 'Submit Report'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
