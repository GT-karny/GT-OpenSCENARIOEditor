import { describe, it, expect } from 'vitest';
import {
  isBulbActive,
  isBulbActiveByIndex,
  getBulbMode,
} from '../../utils/parse-traffic-light-state.js';

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

    it('treats flashing as active', () => {
      expect(isBulbActive('flashing;off;off', 'red')).toBe(true);
      expect(isBulbActive('flashing;off;off', 'yellow')).toBe(false);
      expect(isBulbActive('off;flashing;off', 'yellow')).toBe(true);
      expect(isBulbActive('off;off;flashing', 'green')).toBe(true);
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

describe('isBulbActiveByIndex', () => {
  describe('3-bulb positional', () => {
    it('checks by index for standard 3-light', () => {
      expect(isBulbActiveByIndex('on;off;off', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('on;off;off', 1, 'yellow')).toBe(false);
      expect(isBulbActiveByIndex('on;off;off', 2, 'green')).toBe(false);
    });

    it('detects green at index 2', () => {
      expect(isBulbActiveByIndex('off;off;on', 2, 'green')).toBe(true);
    });
  });

  describe('2-bulb positional', () => {
    it('handles pedestrian signal (2 positions)', () => {
      expect(isBulbActiveByIndex('on;off', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('on;off', 1, 'green')).toBe(false);
      expect(isBulbActiveByIndex('off;on', 0, 'red')).toBe(false);
      expect(isBulbActiveByIndex('off;on', 1, 'green')).toBe(true);
    });

    it('returns false for out-of-bounds index', () => {
      expect(isBulbActiveByIndex('on;off', 2, 'green')).toBe(false);
    });
  });

  describe('1-bulb positional', () => {
    it('handles single bulb', () => {
      expect(isBulbActiveByIndex('on', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('off', 0, 'red')).toBe(false);
    });
  });

  describe('color name fallback', () => {
    it('matches against bulb color identity', () => {
      expect(isBulbActiveByIndex('red', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('red', 1, 'green')).toBe(false);
      expect(isBulbActiveByIndex('green', 0, 'green')).toBe(true);
      expect(isBulbActiveByIndex('yellow', 0, 'yellow')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isBulbActiveByIndex('RED', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('Green', 0, 'green')).toBe(true);
    });
  });

  describe('whitespace handling', () => {
    it('trims whitespace in positional format', () => {
      expect(isBulbActiveByIndex(' on ; off ', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex(' on ; off ', 1, 'green')).toBe(false);
    });
  });

  describe('flashing mode', () => {
    it('treats flashing as active', () => {
      expect(isBulbActiveByIndex('flashing;off;off', 0, 'red')).toBe(true);
      expect(isBulbActiveByIndex('flashing;off;off', 1, 'yellow')).toBe(false);
      expect(isBulbActiveByIndex('off;flashing;off', 1, 'yellow')).toBe(true);
      expect(isBulbActiveByIndex('off;off;flashing', 2, 'green')).toBe(true);
    });

    it('handles single-bulb flashing', () => {
      expect(isBulbActiveByIndex('flashing', 0, 'green')).toBe(true);
      expect(isBulbActiveByIndex('flashing', 1, 'green')).toBe(false);
    });
  });
});

describe('getBulbMode', () => {
  describe('3-bulb positional', () => {
    it('returns correct mode for on/off/flashing', () => {
      expect(getBulbMode('on;off;off', 0, 'red')).toBe('on');
      expect(getBulbMode('on;off;off', 1, 'yellow')).toBe('off');
      expect(getBulbMode('flashing;off;off', 0, 'red')).toBe('flashing');
      expect(getBulbMode('off;flashing;off', 1, 'yellow')).toBe('flashing');
      expect(getBulbMode('off;off;flashing', 2, 'green')).toBe('flashing');
    });

    it('returns off for out-of-bounds index', () => {
      expect(getBulbMode('on;off', 2, 'green')).toBe('off');
    });
  });

  describe('single token', () => {
    it('returns mode for index 0', () => {
      expect(getBulbMode('on', 0, 'red')).toBe('on');
      expect(getBulbMode('off', 0, 'red')).toBe('off');
      expect(getBulbMode('flashing', 0, 'green')).toBe('flashing');
    });

    it('returns off for index > 0', () => {
      expect(getBulbMode('flashing', 1, 'yellow')).toBe('off');
    });
  });

  describe('color name fallback', () => {
    it('returns on when color matches', () => {
      expect(getBulbMode('red', 0, 'red')).toBe('on');
      expect(getBulbMode('green', 0, 'green')).toBe('on');
    });

    it('returns off when color does not match', () => {
      expect(getBulbMode('red', 0, 'green')).toBe('off');
    });
  });

  describe('case insensitivity', () => {
    it('handles mixed case', () => {
      expect(getBulbMode('Flashing;Off;Off', 0, 'red')).toBe('flashing');
      expect(getBulbMode('OFF;FLASHING;OFF', 1, 'yellow')).toBe('flashing');
    });
  });
});
