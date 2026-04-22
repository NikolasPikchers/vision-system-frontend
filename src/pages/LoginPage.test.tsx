import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/stores/auth';

vi.mock('@/api/auth', () => ({
  login: vi.fn(async () => ({
    success: true, session_id: 'S', username: 'admin',
    expires_in: 1800, token_type: 'Bearer',
  })),
  logout: vi.fn(),
}));

beforeEach(() => {
  localStorage.clear();
  useAuth.setState({ sessionId: null, username: null, expiresAt: null });
});

describe('LoginPage', () => {
  it('renders login form in Russian', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText('Логин')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('submits credentials and stores session', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    const user = userEvent.setup();
    const loginInput = screen.getByLabelText('Логин') as HTMLInputElement;
    const passInput = screen.getByLabelText('Пароль') as HTMLInputElement;
    await user.clear(loginInput);
    await user.type(loginInput, 'admin');
    await user.clear(passInput);
    await user.type(passInput, 'admin');
    await user.click(screen.getByRole('button', { name: 'Войти' }));
    const raw = localStorage.getItem('vs_auth');
    expect(raw).toContain('"sessionId":"S"');
  });
});
