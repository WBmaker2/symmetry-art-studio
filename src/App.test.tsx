import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Symmetry Art Studio app shell', () => {
  it('lets students switch symmetry axes and drawing tools', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: '가로 대칭축' }));
    expect(screen.getByRole('status')).toHaveTextContent('가로 대칭축');

    await user.click(screen.getByRole('button', { name: '지우개' }));
    expect(screen.getByRole('button', { name: '지우개' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: '파랑' }));
    expect(screen.getByRole('button', { name: '파랑' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: '지우개' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });
});
