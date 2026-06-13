// @ts-ignore Vitest runs this source-contract test in Node; project intentionally has no @types/node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/child-app.css', 'utf8');

describe('full-width menu page layout', () => {
  it('uses the full viewport width minus the left sidebar for every menu page shell', () => {
    expect(css).toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*width:\s*calc\(100vw - 250px\)/s);
    expect(css).toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*max-width:\s*none/s);
    expect(css).toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*margin-left:\s*250px/s);
    expect(css).toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*margin-right:\s*0/s);
    expect(css).not.toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*980px/s);
    expect(css).not.toMatch(/\.has-side-nav \.child-app-shell\s*{[^}]*margin-right:\s*auto/s);
  });

  it('does not recenter the multiplication reward block inside a narrow max-width container', () => {
    expect(css).toMatch(/\.math-rewards-card\s*{[^}]*width:\s*100%/s);
    expect(css).toMatch(/\.math-rewards-card\s*{[^}]*max-width:\s*none/s);
    expect(css).toMatch(/\.math-rewards-card\s*{[^}]*margin:\s*0;/s);
  });
});
