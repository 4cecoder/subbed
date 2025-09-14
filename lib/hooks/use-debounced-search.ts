import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
}

export function useDebouncedSearch(
  initialValue: string = '',
  onSearch: (query: string) => void,
  options: UseDebouncedSearchOptions = {}
) {
  const { delay = 300, minLength = 0 } = options;
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce the search
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (query.length >= minLength || query === '') {
        setDebouncedQuery(query);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay, minLength]);

  // Trigger search when debounced query changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    debouncedQuery,
    updateQuery,
    clearQuery,
    isSearching: query !== debouncedQuery,
  };
}
