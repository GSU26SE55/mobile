import { useEffect, useState } from 'react';

/**
 * Trì hoãn cập nhật giá trị — dùng cho ô search để không bắn request mỗi ký tự.
 * Đặt ở shared/ vì nhiều feature dùng (kb, blog, battery-types).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
