import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'post' | 'event' | 'person' | 'listing' | 'place';
  route: string;
}

interface SearchResults {
  posts: SearchResult[];
  events: SearchResult[];
  people: SearchResult[];
  listings: SearchResult[];
  places: SearchResult[];
}

const EMPTY_RESULTS: SearchResults = {
  posts: [],
  events: [],
  people: [],
  listings: [],
  places: [],
};

export function useGlobalSearch(query: string) {
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const pattern = `%${term.trim()}%`;

    try {
      const [postsRes, eventsRes, profilesRes, listingsRes, placesRes] =
        await Promise.all([
          supabase
            .from('wall_posts')
            .select('id, content, created_at')
            .ilike('content', pattern)
            .limit(5),
          supabase
            .from('events')
            .select('id, title, date, location')
            .ilike('title', pattern)
            .limit(5),
          supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .ilike('display_name', pattern)
            .limit(5),
          supabase
            .from('marketplace_listings')
            .select('id, title, price, status')
            .ilike('title', pattern)
            .eq('status', 'active')
            .limit(5),
          supabase
            .from('local_places')
            .select('id, name, category, address')
            .ilike('name', pattern)
            .limit(5),
        ]);

      setResults({
        posts: (postsRes.data ?? []).map((p) => ({
          id: p.id,
          title: p.content?.slice(0, 80) ?? '',
          subtitle: new Date(p.created_at).toLocaleDateString(),
          type: 'post',
          route: `/post/${p.id}`,
        })),
        events: (eventsRes.data ?? []).map((e) => ({
          id: e.id,
          title: e.title ?? '',
          subtitle: e.date
            ? new Date(e.date).toLocaleDateString()
            : (e.location ?? ''),
          type: 'event',
          route: `/event/${e.id}`,
        })),
        people: (profilesRes.data ?? []).map((p) => ({
          id: p.id,
          title: p.display_name ?? '',
          subtitle: p.username ? `@${p.username}` : '',
          type: 'person',
          route: `/profile/${p.id}`,
        })),
        listings: (listingsRes.data ?? []).map((l) => ({
          id: l.id,
          title: l.title ?? '',
          subtitle: l.price != null ? `$${l.price}` : 'Free',
          type: 'listing',
          route: `/listing/${l.id}`,
        })),
        places: (placesRes.data ?? []).map((p) => ({
          id: p.id,
          title: p.name ?? '',
          subtitle: p.category ?? (p.address ?? ''),
          type: 'place',
          route: `/discover/${p.id}`,
        })),
      });
    } catch {
      setResults(EMPTY_RESULTS);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(EMPTY_RESULTS);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const totalResults =
    results.posts.length +
    results.events.length +
    results.people.length +
    results.listings.length +
    results.places.length;

  return { results, isSearching, totalResults };
}
