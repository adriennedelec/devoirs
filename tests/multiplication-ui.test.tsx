import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

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
});
