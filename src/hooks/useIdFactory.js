import { useRef, useCallback } from 'react';

export default function useIdFactory(start = 0) {
  const ref = useRef(start);
  return useCallback(() => ref.current++, []);
}
