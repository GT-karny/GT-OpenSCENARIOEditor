/**
 * P4 Wave X2: poly3/paramPoly3 geometry became editable (readOnly gating
 * removed). These guard that coefficient + common-field edits dispatch the
 * flat geometry patch, and that paramPoly3 pRange is a working select.
 */
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import type { OdrGeometryPoly3, OdrGeometryParamPoly3 } from '@osce/shared';
import { initTestI18n, renderWithProviders } from '../../../../helpers/render-with-providers';
import { OdrGeometryPropertyEditor } from '../../../../../features/road/components/property/OdrGeometryPropertyEditor';

beforeAll(async () => {
  await initTestI18n();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function labeledInput(labelText: string): HTMLInputElement {
  const label = screen.getByText(labelText);
  return label.parentElement!.querySelector('input')!;
}

const poly3: OdrGeometryPoly3 = {
  s: 0,
  x: 1,
  y: 2,
  hdg: 0,
  length: 10,
  type: 'poly3',
  a: 0,
  b: 0,
  c: 0,
  d: 0,
};

const paramPoly3: OdrGeometryParamPoly3 = {
  s: 0,
  x: 0,
  y: 0,
  hdg: 0,
  length: 10,
  type: 'paramPoly3',
  aU: 0,
  bU: 0,
  cU: 0,
  dU: 0,
  aV: 0,
  bV: 0,
  cV: 0,
  dV: 0,
  pRange: 'arcLength',
};

describe('OdrGeometryPropertyEditor poly3/paramPoly3 editing', () => {
  it('dispatches a poly3 coefficient edit', () => {
    const onUpdate = vi.fn();
    renderWithProviders(
      <OdrGeometryPropertyEditor geometry={poly3} index={0} onUpdate={onUpdate} />,
    );
    fireEvent.change(labeledInput('c'), { target: { value: '0.5' } });
    expect(onUpdate).toHaveBeenCalledWith({ c: 0.5 });
  });

  it('dispatches a common-field edit on a poly3 segment (no longer read-only)', () => {
    const onUpdate = vi.fn();
    renderWithProviders(
      <OdrGeometryPropertyEditor geometry={poly3} index={0} onUpdate={onUpdate} />,
    );
    fireEvent.change(labeledInput('X'), { target: { value: '3' } });
    expect(onUpdate).toHaveBeenCalledWith({ x: 3 });
  });

  it('dispatches a paramPoly3 U-coefficient edit', () => {
    const onUpdate = vi.fn();
    renderWithProviders(
      <OdrGeometryPropertyEditor geometry={paramPoly3} index={0} onUpdate={onUpdate} />,
    );
    fireEvent.change(labeledInput('bU'), { target: { value: '2' } });
    expect(onUpdate).toHaveBeenCalledWith({ bU: 2 });
  });

  it('changes paramPoly3 pRange through the select', () => {
    const onUpdate = vi.fn();
    renderWithProviders(
      <OdrGeometryPropertyEditor geometry={paramPoly3} index={0} onUpdate={onUpdate} />,
    );
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'normalized' }));
    expect(onUpdate).toHaveBeenCalledWith({ pRange: 'normalized' });
  });
});
