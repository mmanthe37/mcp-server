import React from 'react';
import { View } from 'react-native';
import { SkeletonLoader } from './SkeletonLoader';

export function PostSkeleton() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 border border-gray-100 dark:border-gray-700">
      <View className="flex-row items-center mb-3">
        <SkeletonLoader variant="avatar" />
        <View className="ml-3 flex-1">
          <SkeletonLoader variant="title" className="w-1/3 mb-1.5" />
          <SkeletonLoader variant="text" className="w-1/4" />
        </View>
      </View>
      <SkeletonLoader variant="text" className="w-full mb-2" />
      <SkeletonLoader variant="text" className="w-5/6 mb-3" />
      <SkeletonLoader variant="image" className="h-44" />
    </View>
  );
}

export function EventSkeleton() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-3 border border-gray-100 dark:border-gray-700">
      <SkeletonLoader variant="image" className="h-36 rounded-none" />
      <View className="p-4">
        <SkeletonLoader variant="title" className="w-2/3 mb-2" />
        <SkeletonLoader variant="text" className="w-1/3 mb-1.5" />
        <SkeletonLoader variant="text" className="w-1/2" />
      </View>
    </View>
  );
}

export function ListingSkeleton() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-3 border border-gray-100 dark:border-gray-700">
      <SkeletonLoader variant="image" className="h-40 rounded-none" />
      <View className="p-4">
        <SkeletonLoader variant="title" className="w-3/4 mb-2" />
        <SkeletonLoader variant="text" className="w-1/4" />
      </View>
    </View>
  );
}

export function MessageSkeleton() {
  return (
    <View className="flex-row items-center py-3 px-4">
      <SkeletonLoader variant="avatar" className="w-12 h-12" />
      <View className="ml-3 flex-1">
        <SkeletonLoader variant="title" className="w-1/3 mb-1.5" />
        <SkeletonLoader variant="text" className="w-2/3" />
      </View>
    </View>
  );
}

export function PlaceSkeleton() {
  return (
    <View className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden mb-3 border border-gray-100 dark:border-gray-700">
      <SkeletonLoader variant="image" className="h-32 rounded-none" />
      <View className="p-4">
        <SkeletonLoader variant="title" className="w-2/3 mb-2" />
        <SkeletonLoader variant="text" className="w-1/3" />
      </View>
    </View>
  );
}
