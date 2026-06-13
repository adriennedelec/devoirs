import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../src/App';

describe('child app first screen', () => {
  it('renders the API-ready child dashboard shell from service data', async () => {
    render(<App />);

    expect(screen.getByText(/chargement de ton aventure/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /bonjour emma/i })).toBeInTheDocument();
    });

    expect(screen.queryByText(/125 étoiles/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /notifications/i })).not.toBeInTheDocument();
    expect(screen.getByText(/mon objectif du jour/i)).toBeInTheDocument();
    expect(screen.getByText(/tables de multiplication/i)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /navigation enfant/i })).toBeInTheDocument();
  });
});
