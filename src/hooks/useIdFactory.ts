import { useRef, useCallback } from 'react';

export default function useIdFactory(start = 0): () => number {
  const ref = useRef<number>(start);
  return useCallback(() => ref.current++, []);
}
