"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Recharts 3'ün `ResponsiveContainer`'ı Next 16 / React 19.2 altında ölçtüğü dış
 * div'i 0×0 görüp grafiği boş bırakıyor. Bu hook, döndürdüğü callback ref'i bir
 * elemente bağlayıp ResizeObserver ile ölçerek grafiğe açık piksel
 * `width`/`height` vermeyi sağlar — versiyon bağımsız, güvenilir çözüm.
 *
 * Callback ref kullanılıyor; böylece render sırasında `ref.current` okunmaz
 * (react-hooks "refs during render" kuralını tetiklemez).
 *
 * Kullanım:
 *   const [setChartRef, { width, height }] = useChartSize();
 *   return (
 *     <div ref={setChartRef} className="h-full w-full">
 *       {width > 0 && <BarChart width={width} height={height} ... />}
 *     </div>
 *   );
 */
export function useChartSize<T extends HTMLElement = HTMLDivElement>() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const observerRef = useRef<ResizeObserver | null>(null);

  const setRef = useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    observerRef.current = ro;
  }, []);

  return [setRef, size] as const;
}
