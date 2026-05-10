/**
 * Deep Linking — URL scheme and universal link handling for NexusShell.
 * Routes deep links to appropriate screens.
 */

import { Linking } from 'react-native';

export interface DeepLink {
  scheme: string;
  path: string;
  params: Record<string, string>;
}

const URL_SCHEME = 'nexusshell';

export function parseDeepLink(url: string): DeepLink | null {
  try {
    // Handle custom scheme: nexusshell://path?params
    if (url.startsWith(`${URL_SCHEME}://`)) {
      const withoutScheme = url.replace(`${URL_SCHEME}://`, '');
      const [pathPart, queryPart] = withoutScheme.split('?');
      const params: Record<string, string> = {};

      if (queryPart) {
        for (const pair of queryPart.split('&')) {
          const [key, value] = pair.split('=');
          if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      }

      return { scheme: URL_SCHEME, path: pathPart || '', params };
    }

    // Handle universal links: https://nexusshell.app/path
    if (url.includes('nexusshell.app')) {
      const parsed = new URL(url);
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((value, key) => { params[key] = value; });
      return { scheme: 'https', path: parsed.pathname.slice(1), params };
    }

    return null;
  } catch {
    return null;
  }
}

export function getRouteForDeepLink(link: DeepLink): string {
  const { path, params } = link;

  switch (path) {
    case 'terminal':
    case 'session':
      return params.sessionId ? `/(app)/terminal?sessionId=${params.sessionId}` : '/(app)/terminal';
    case 'sessions':
      return '/(app)/sessions';
    case 'devices':
      return '/(app)/devices';
    case 'pair':
      return `/(app)/devices?pairingCode=${params.code || ''}`;
    case 'settings':
      return '/(app)/settings';
    default:
      return '/(app)/terminal';
  }
}

export async function handleInitialUrl(): Promise<string | null> {
  const url = await Linking.getInitialURL();
  if (!url) return null;

  const link = parseDeepLink(url);
  if (!link) return null;

  return getRouteForDeepLink(link);
}

export function subscribeToDeepLinks(
  callback: (route: string) => void,
): () => void {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const link = parseDeepLink(url);
    if (link) {
      callback(getRouteForDeepLink(link));
    }
  });

  return () => subscription.remove();
}

export function buildDeepLink(path: string, params?: Record<string, string>): string {
  let url = `${URL_SCHEME}://${path}`;
  if (params && Object.keys(params).length > 0) {
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    url += `?${query}`;
  }
  return url;
}
