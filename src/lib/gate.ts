"use client";

/**
 * The "reveal gate": closed while the loader or the page-transition curtain covers the screen.
 * Page intros call whenRevealed() so they play the moment the page is uncovered, never behind a curtain.
 */
let open = false;
const queue = new Set<() => void>();

export function whenRevealed(cb: () => void) {
  if (open) {
    const id = requestAnimationFrame(cb);
    return () => cancelAnimationFrame(id);
  }
  queue.add(cb);
  return () => {
    queue.delete(cb);
  };
}

export function closeGate() {
  open = false;
}

export function openGate() {
  open = true;
  const pending = [...queue];
  queue.clear();
  pending.forEach((cb) => cb());
}
