import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'image';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
}

const variantDefaults: Record<SkeletonVariant, { className: string }> = {
  text: { className: 'h-3 w-3/4 rounded-md' },
  title: { className: 'h-5 w-full rounded-md' },
  avatar: { className: 'w-10 h-10 rounded-full' },
  card: { className: 'h-40 w-full rounded-2xl' },
  image: { className: 'h-48 w-full rounded-xl' },
};

export function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className = '',
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const defaults = variantDefaults[variant];
  const sizeStyle: Record<string, number | string> = {};
  if (width !== undefined) sizeStyle.width = width;
  if (height !== undefined) sizeStyle.height = height;

  return (
    <Animated.View
      style={[{ opacity }, sizeStyle]}
      className={`bg-gray-200 dark:bg-gray-700 ${defaults.className} ${className}`}
    />
  );
}
