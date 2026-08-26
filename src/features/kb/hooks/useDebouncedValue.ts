// Moved to shared/ since blog + battery-types also use it.
// Keep the re-export so existing imports in the kb feature don't need to change.
export { useDebouncedValue } from '@/src/shared/hooks/useDebouncedValue';
