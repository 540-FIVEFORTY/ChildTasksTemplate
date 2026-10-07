import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TemplateSearch } from './TemplateSearch';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const TEMPLATES = ['Bug fix', 'Recette', 'Développement', 'Dev ops'];

function Harness({
  onPick = vi.fn(),
  selected = [] as string[],
}: {
  onPick?: (name: string) => void;
  selected?: string[];
}) {
  const [query, setQuery] = useState('');
  return (
    <TemplateSearch
      templates={TEMPLATES}
      query={query}
      onQueryChange={setQuery}
      onPick={onPick}
      isSelected={(name) => selected.includes(name)}
    />
  );
}

let container: HTMLDivElement | null = null;
let root: Root | null = null;

function render(element: JSX.Element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(element));
}

function input(): HTMLInputElement {
  return container!.querySelector<HTMLInputElement>('[role="combobox"]')!;
}

function options(): HTMLElement[] {
  return Array.from(container!.querySelectorAll<HTMLElement>('[role="option"]'));
}

function option(name: string): HTMLElement {
  return options().find((element) => element.textContent === name)!;
}

function optionNames(): string[] {
  return options().map((element) => element.textContent ?? '');
}

function listbox(): Element | null {
  return container!.querySelector('[role="listbox"]');
}

function focus() {
  act(() => input().focus());
}

function type(value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function press(key: string) {
  act(() => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

function click(element: HTMLElement) {
  act(() => {
    element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    element.click();
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  container = null;
  root = null;
});

describe('TemplateSearch', () => {
  it('lists the matching template names while typing, ignoring accents', () => {
    render(<Harness />);

    focus();
    type('dev');

    expect(optionNames()).toEqual(['Développement', 'Dev ops']);
  });

  it('shows every template when the box gets focus', () => {
    render(<Harness />);

    focus();

    expect(optionNames()).toEqual(TEMPLATES);
  });

  it('picks the highlighted name with the keyboard and clears the box', () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);

    focus();
    type('dev');
    press('ArrowDown');
    press('Enter');

    expect(onPick).toHaveBeenCalledWith('Dev ops');
    expect(input().value).toBe('');
    expect(listbox()).toBeNull();
  });

  it('picks a name with the mouse', () => {
    const onPick = vi.fn();
    render(<Harness onPick={onPick} />);

    focus();
    click(option('Recette'));

    expect(onPick).toHaveBeenCalledWith('Recette');
  });

  it('marks templates that are already selected', () => {
    render(<Harness selected={['Recette']} />);

    focus();

    expect(option('Recette').getAttribute('aria-selected')).toBe('true');
    expect(option('Bug fix').getAttribute('aria-selected')).toBe('false');
  });

  it('closes the list with Escape, then clears the text with a second Escape', () => {
    render(<Harness />);

    focus();
    type('rec');
    press('Escape');
    expect(listbox()).toBeNull();
    expect(input().value).toBe('rec');

    press('Escape');
    expect(input().value).toBe('');
  });
});
