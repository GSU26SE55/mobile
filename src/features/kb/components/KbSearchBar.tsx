import React from 'react';
import { SearchBar } from '@/src/shared/components/SearchBar';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/** Ô tìm kiếm của KB — chỉ là SearchBar dùng chung + placeholder riêng. */
export function KbSearchBar({
  value,
  onChangeText,
  placeholder = 'Tìm theo tiêu đề, mã hoặc tag…',
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
