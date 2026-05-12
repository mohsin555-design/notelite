export type PopoverAlignment = "left" | "right";

export function getAnchoredPopoverPosition(
  rect: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  {
    width,
    height,
    align = "right",
    gap = 8,
    viewportWidth,
    viewportHeight,
    margin = 8,
  }: {
    width: number;
    height: number;
    align?: PopoverAlignment;
    gap?: number;
    viewportWidth: number;
    viewportHeight: number;
    margin?: number;
  },
) {
  const left =
    align === "left"
      ? Math.max(margin, Math.min(rect.left, viewportWidth - width - margin))
      : Math.max(margin, Math.min(rect.right - width, viewportWidth - width - margin));

  const fitsBelow = rect.bottom + gap + height <= viewportHeight - margin;
  const top = fitsBelow
    ? rect.bottom + gap
    : Math.max(margin, rect.top - gap - height);

  return {
    left,
    top,
  };
}
