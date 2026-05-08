"use client";

import { type RefObject, useEffect } from "react";

type OutsideEvent = MouseEvent | TouchEvent | PointerEvent;

export function useClickOutside<T extends HTMLElement>(
  refs: RefObject<T | null> | Array<RefObject<T | null>>,
  onOutsideClick: (event: OutsideEvent) => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const refList = Array.isArray(refs) ? refs : [refs];

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      const clickedInside = refList.some((ref) => ref.current?.contains(target));
      if (!clickedInside) {
        onOutsideClick(event);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [enabled, onOutsideClick, refs]);
}
