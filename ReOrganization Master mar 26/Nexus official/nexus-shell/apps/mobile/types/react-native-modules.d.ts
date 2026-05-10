declare module '@react-native-community/slider' {
  import { Component } from 'react';
  import { ViewProps } from 'react-native';

  interface SliderProps extends ViewProps {
    value?: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    minimumTrackTintColor?: string;
    maximumTrackTintColor?: string;
    thumbTintColor?: string;
    disabled?: boolean;
    onValueChange?: (value: number) => void;
    onSlidingStart?: (value: number) => void;
    onSlidingComplete?: (value: number) => void;
  }

  export default class Slider extends Component<SliderProps> {}
}

declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    mergeItem(key: string, value: string): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<readonly string[]>;
    multiGet(keys: readonly string[]): Promise<readonly [string, string | null][]>;
    multiSet(keyValuePairs: readonly [string, string][]): Promise<void>;
    multiRemove(keys: readonly string[]): Promise<void>;
    multiMerge(keyValuePairs: readonly [string, string][]): Promise<void>;
  }

  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

declare module 'expo-local-authentication' {
  export enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2,
    IRIS = 3,
  }

  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function authenticateAsync(options?: {
    promptMessage?: string;
    cancelLabel?: string;
    disableDeviceFallback?: boolean;
    fallbackLabel?: string;
  }): Promise<{ success: boolean; error?: string }>;
  export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
}

declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}

declare module 'expo-haptics' {
  export enum ImpactFeedbackStyle {
    Light = 'light',
    Medium = 'medium',
    Heavy = 'heavy',
  }

  export enum NotificationFeedbackType {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
  }

  export function impactAsync(style?: ImpactFeedbackStyle): Promise<void>;
  export function notificationAsync(type?: NotificationFeedbackType): Promise<void>;
  export function selectionAsync(): Promise<void>;
}
