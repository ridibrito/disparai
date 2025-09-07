import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConversationsPageWithUser } from './conversations-page-with-user';

describe('ConversationsPageWithUser', () => {
  it('renders the Conversations heading', () => {
    render(<ConversationsPageWithUser />);
    expect(screen.getByRole('heading', { name: /Conversas/i })).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<ConversationsPageWithUser />);
    expect(screen.getByPlaceholderText(/Pesquisar ou começar uma nova conversa/i)).toBeInTheDocument();
  });

  // Add more tests as needed, e.g., for loading states, empty states, message sending
});
