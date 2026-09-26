import { useEffect, useRef, useState } from 'react';
import { isReducedMotion } from '../utils/helpers';

export function useTypewriter(text, { enabled = true, speed = 34, start = true } = {}) {
  const [count, setCount] = useState(enabled && !isReducedMotion() ? 0 : (text || '').length);
  const timer = useRef(null);

  useEffect(() => {
    if (!enabled || isReducedMotion() || !start) {
      setCount((text || '').length);
      return undefined;
    }
    setCount(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= (text || '').length) {
        clearInterval(timer.current);
      }
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, enabled, speed, start]);

  const value = (text || '').slice(0, count);
  const done = count >= (text || '').length;
  return { value, done };
}
