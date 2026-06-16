// @ts-ignore Vitest runs this source-contract test in Node; project intentionally has no @types/node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/child-app.css', 'utf8');

describe('profile activity chart layout contract', () => {
  it('aligns the Y axis, horizontal grid, and bars on the same plot area', () => {
    expect(css).toMatch(/\.activity-chart-with-axis\s*{[^}]*--activity-plot-height:\s*96px/s);
    expect(css).toMatch(/\.activity-chart-with-axis::before\s*{[^}]*height:\s*var\(--activity-plot-height\)/s);
    expect(css).toMatch(/\.activity-chart-with-axis::before\s*{[^}]*background-image:\s*linear-gradient\(to bottom/s);
    expect(css).toMatch(/\.activity-y-axis\s*{[^}]*height:\s*var\(--activity-plot-height\)/s);
    expect(css).toMatch(/\.activity-bars-group\s*{[^}]*height:\s*var\(--activity-plot-height\)/s);
    expect(css).not.toMatch(/\.activity-y-axis\s*{[^}]*padding:\s*2px 0 24px/s);
    expect(css).not.toMatch(/\.activity-grouped-chart\s*{[^}]*padding-top:\s*8px/s);
  });
});

describe('full-width menu page layout', () => {
  it('keeps the authenticated sidebar fixed full-height with the user card pinned at the bottom', () => {
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*position:\s*fixed/s);
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*top:\s*0/s);
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*left:\s*0/s);
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*height:\s*100vh/s);
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*display:\s*flex/s);
    expect(css).toMatch(/\.child-side-nav\s*{[^}]*flex-direction:\s*column/s);
    expect(css).toMatch(/\.side-nav-user-card\s*{[^}]*margin-top:\s*auto/s);
    expect(css).toMatch(/\.side-nav-logout-button\s*{/s);
  });

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

  it('keeps Profile and Table pages on the same global background as the menu', () => {
    expect(css).toMatch(/\.family-profile-screen\s*{[^}]*background:\s*transparent/s);
    expect(css).toMatch(/\.multiplication-app-layout\s*{[^}]*background:\s*transparent/s);
    expect(css).toMatch(/\.multiplication-screen\s*{[^}]*background:\s*transparent/s);
    expect(css).toMatch(/\.multiplication-screen::before\s*{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.multiplication-screen::after\s*{[^}]*display:\s*none/s);
    expect(css).not.toMatch(/\.family-profile-screen\s*{[^}]*background:\s*var\(--color-page-profile\)/s);
  });
});
