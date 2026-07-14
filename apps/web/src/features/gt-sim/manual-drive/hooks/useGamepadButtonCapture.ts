/**
 * Hook to capture a button press from a connected gamepad/wheel using the
 * browser's Gamepad API.
 *
 * Ported unmodified from the GT_Sim fork's `hooks/useGamepadButtonCapture.ts`
 * (pure browser-API hook, no `api`/styling dependency, no changes needed).
 * The Gamepad API works identically in the renderer process, so this is a
 * verbatim port.
 *
 * Usage:
 *   const { capturing, startCapture, cancel } = useGamepadButtonCapture(onCapture);
 *   // onCapture(buttonIndex) is called when a button is pressed
 */
import { useState, useCallback, useRef, useEffect } from 'react';

export function useGamepadButtonCapture(
  onCapture: (buttonIndex: number) => void,
  timeoutMs = 5000,
) {
  const [capturing, setCapturing] = useState(false);
  const rafRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const baselineRef = useRef<boolean[]>([]);
  const onCaptureRef = useRef(onCapture);
  // Track the latest callback without making startCapture depend on it.
  useEffect(() => {
    onCaptureRef.current = onCapture;
  });

  const cancel = useCallback(() => {
    setCapturing(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const startCapture = useCallback(() => {
    // Snapshot current button states as baseline (to detect new presses)
    const gamepads = navigator.getGamepads();
    const gp = gamepads[0]; // Use first gamepad
    if (gp) {
      baselineRef.current = gp.buttons.map((b) => b.pressed);
    } else {
      baselineRef.current = [];
    }

    setCapturing(true);

    const poll = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        for (let i = 0; i < gp.buttons.length; i++) {
          // Detect new press (not pressed in baseline, pressed now)
          const wasPressed = baselineRef.current[i] ?? false;
          if (gp.buttons[i].pressed && !wasPressed) {
            cancel();
            onCaptureRef.current(i);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(poll);
    };

    rafRef.current = requestAnimationFrame(poll);

    // Timeout
    timeoutRef.current = setTimeout(() => {
      cancel();
    }, timeoutMs);
  }, [timeoutMs, cancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { capturing, startCapture, cancel };
}
