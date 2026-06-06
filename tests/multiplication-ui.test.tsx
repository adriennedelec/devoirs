import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

declare const process: { cwd: () => string };
declare function require(moduleName: string): { readFileSync?: (path: string, encoding: string) => string; resolve?: (...paths: string[]) => string };
const { readFileSync } = require('node:fs') as { readFileSync: (path: string, encoding: string) => string };
const { resolve } = require('node:path') as { resolve: (...paths: string[]) => string };

describe('Lot 3 multiplication module UI', () => {
  it('opens the multiplication adventure from Accueil and advances after a correct QCM answer', async () => {
    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    const multiplicationCard = screen.getByRole('heading', { name: /tables de multiplication/i }).closest('article');
    expect(multiplicationCard).not.toBeNull();

    await user.click(within(multiplicationCard!).getByRole('button', { name: /continuer/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /tables de multiplication/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('region', { name: /choisis une table/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /table de 7/i })).toHaveAttribute('aria-pressed', 'true');
    const navigation = screen.getByRole('navigation', { name: /navigation enfant/i });
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveClass('child-side-nav');
    expect(within(navigation).getByRole('button', { name: /tables/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByText(/entraîne-toi et deviens un champion/i)).toBeInTheDocument();
    expect(screen.getByText(/réussis 10 calculs/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /7 × 8 = \?/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '56' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/8 fois 7/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '56' }));

    await waitFor(() => {
      expect(screen.getByText(/question 2 sur 10/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /7 × 6 = \?/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /question suivante/i })).not.toBeInTheDocument();
  });

  it('keeps the sidebar fixed and lets multiplication use the full remaining width', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/child-app.css'), 'utf8');

    expect(css).toContain('.has-side-nav.multiplication-app-layout .child-app-shell');
    expect(css).toContain('width: calc(100vw - 250px);');
    expect(css).toContain('margin-left: 250px;');
    expect(css).toContain('max-width: none;');
    expect(css).toMatch(/\.math-magic-header[\s\S]*?width: 100%;[\s\S]*?max-width: none;/);
    expect(css).toMatch(/\.magic-exercise-card[\s\S]*?width: 100%;[\s\S]*?max-width: none;/);
  });

  it('uses one continuous magical background and a denser multiplication layout', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/child-app.css'), 'utf8');

    expect(css).toMatch(/\.multiplication-app-layout\s*{[\s\S]*?linear-gradient\(135deg, #f8f1ff 0%, #cdb8ff 38%, #dff2ff 100%\);[\s\S]*?}/);
    expect(css).toMatch(/\.has-side-nav\.multiplication-app-layout \.child-app-shell\s*{[\s\S]*?padding: 0;[\s\S]*?}/);
    expect(css).toMatch(/\.multiplication-screen\s*{[\s\S]*?padding: 22px clamp\(16px, 3vw, 36px\) 32px;[\s\S]*?border-radius: 0;[\s\S]*?}/);
    expect(css).toMatch(/\.math-magic-header h1\s*{[\s\S]*?font-size: clamp\(2\.4rem, 5vw, 4\.2rem\);[\s\S]*?}/);
    expect(css).toMatch(/\.math-progress-card\s*{[\s\S]*?min-height: 104px;[\s\S]*?padding: 16px;[\s\S]*?}/);
    expect(css).toMatch(/\.magic-answer-grid button\s*{[\s\S]*?min-height: 58px;[\s\S]*?}/);
  });
});
