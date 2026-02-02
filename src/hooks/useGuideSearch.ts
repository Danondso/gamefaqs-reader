/**
 * useGuideSearch - Custom hook for in-guide search
 *
 * Manages search query, finding matches, and navigating between them.
 */

import { useState, useCallback, useMemo } from 'react';

export function useGuideSearch(content: string) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Find all match positions in content
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim() || !content) return [];

    const matches: number[] = [];
    const query = searchQuery.toLowerCase();
    const lowerContent = content.toLowerCase();

    let index = 0;
    while (index < lowerContent.length) {
      const matchIndex = lowerContent.indexOf(query, index);
      if (matchIndex === -1) break;

      matches.push(matchIndex);
      index = matchIndex + 1;
    }

    return matches;
  }, [searchQuery, content]);

  const hasMatches = searchMatches.length > 0;
  const totalMatches = searchMatches.length;

  const goToNextMatch = useCallback(() => {
    if (!hasMatches) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  }, [hasMatches, totalMatches]);

  const goToPreviousMatch = useCallback(() => {
    if (!hasMatches) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  }, [hasMatches, totalMatches]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);

  const currentMatchPosition = hasMatches ? searchMatches[currentMatchIndex] : undefined;

  return {
    searchQuery,
    setSearchQuery,
    searchMatches,
    currentMatchIndex,
    currentMatchPosition,
    hasMatches,
    totalMatches,
    goToNextMatch,
    goToPreviousMatch,
    clearSearch,
  };
}
