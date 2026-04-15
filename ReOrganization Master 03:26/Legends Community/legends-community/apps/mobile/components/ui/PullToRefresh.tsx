import React, { useState, useCallback } from 'react';
import { ScrollView, RefreshControl, Platform } from 'react-native';
import { COLORS } from '@/lib/constants';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefresh({
  onRefresh,
  children,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <ScrollView
      className={`flex-1 ${className}`}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
          colors={[COLORS.primary]}
          title={Platform.OS === 'ios' ? 'Pull to refresh' : undefined}
          titleColor={COLORS.primary}
        />
      }
    >
      {children}
    </ScrollView>
  );
}
