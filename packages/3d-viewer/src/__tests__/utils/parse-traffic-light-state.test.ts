import { describe, it, expect } from 'vitest';
import { isBulbActive } from '../../utils/parse-traffic-light-state.js';

describe('isBulbActive', () => {
  describe('esmini positional format (semicolon-separated)', () => {
    it('detects red from "on;off;off"', () => {
      expect(isBulbActive('on;off;off', 'red')).toBe(true);
      expect(isBulbActive('on;off;off', 'yellow')).toBe(false);
      expect(isBulbActive('on;off;off', 'green')).toBe(false);
    });

    it('detects yellow from "off;on;off"', () => {
      expect(isBulbActive('off;on;off', 'red')).toBe(false);
      expect(isBulbActive('off;on;off', 'yellow')).toBe(true);
      expect(isBulbActive('off;on;off', 'green')).toBe(false);
    });

    it('detects green from "off;off;on"', () => {
      expect(isBulbActive('off;off;on', 'red')).toBe(false);
      expect(isBulbActive('off;off;on', 'yellow')).toBe(false);
      expect(isBulbActive('off;off;on', 'green')).toBe(true);
    });

    it('handles all off', () => {
      expect(isBulbActive('off;off;off', 'red')).toBe(false);
      expect(isBulbActive('off;off;off', 'yellow')).toBe(false);
      expect(isBulbActive('off;off;off', 'green')).toBe(false);
    });

    it('handles all on', () => {
      expect(isBulbActive('on;on;on', 'red')).toBe(true);
      expect(isBulbActive('on;on;on', 'yellow')).toBe(true);
      expect(isBulbActive('on;on;on', 'green')).toBe(true);
    });

    it('handles case insensitivity', () => {
      expect(isBulbActive('On;Off;Off', 'red')).toBe(true);
      expect(isBulbActive('ON;OFF;OFF', 'red')).toBe(true);
    });

    it('handles whitespace around values', () => {
      expect(isBulbActive('on ; off ; off', 'red')).toBe(true);
      expect(isBulbActive('on ; off ; off', 'yellow')).toBe(false);
    });

    it('handles 2-bulb pedestrian signal (only red;green positions)', () => {
      expect(isBulbActive('on;off', 'red')).toBe(true);
      expect(isBulbActive('on;off', 'yellow')).toBe(false);
      expect(isBulbActive('off;on', 'red')).toBe(false);
      expect(isBulbActive('off;on', 'yellow')).toBe(true);
      // green index (2) is out of bounds for 2-element array
      expect(isBulbActive('off;on', 'green')).toBe(false);
    });
  });

  describe('color name format', () => {
    it('detects color by name', () => {
      expect(isBulbActive('red', 'red')).toBe(true);
      expect(isBulbActive('red', 'yellow')).toBe(false);
      expect(isBulbActive('green', 'green')).toBe(true);
      expect(isBulbActive('yellow', 'yellow')).toBe(true);
    });

    it('handles case insensitivity', () => {
      expect(isBulbActive('RED', 'red')).toBe(true);
      expect(isBulbActive('Green', 'green')).toBe(true);
    });
  });
});
