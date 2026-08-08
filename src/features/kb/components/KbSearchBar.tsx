import React from 'react';
import { SearchBar } from '@/src/shared/components/SearchBar';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** KB search field — just the shared SearchBar with its own placeholder. */
export function KbSearchBar({
  value,
  onChangeText,
  placeholder = 'Search by title, code, or tag…',
  autoFocus,
}: Props) {
  return (
    <SearchBar
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}
