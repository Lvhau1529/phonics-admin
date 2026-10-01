import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Providers } from '@/app/providers';
import { resetAuthStoreForTests } from '@/features/auth/authStore';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { t } from '@/shared/i18n';

describe('LoginPage', () => {
  beforeEach(() => resetAuthStoreForTests());
  afterEach(() => resetAuthStoreForTests());

  it('render form email / mật khẩu với provider (antd + query + router)', () => {
    render(
      <Providers bootstrap={false}>
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>
      </Providers>,
    );
    expect(screen.getByText(t.auth.loginSubtitle)).toBeInTheDocument();
    expect(screen.getByLabelText(t.auth.email)).toBeInTheDocument();
    expect(screen.getByLabelText(t.auth.password)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.auth.submit })).toBeInTheDocument();
    expect(document.title).toBe(t.app.title(t.auth.loginTitle));
  });
});
