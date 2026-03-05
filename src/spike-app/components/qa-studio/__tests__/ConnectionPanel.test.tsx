// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { ConnectionPanel } from '../ConnectionPanel';

describe('ConnectionPanel', () => {
  it('renders disconnected state', () => {
    const handleConnect = vi.fn();
    const handleDisconnect = vi.fn();

    render(
      <ConnectionPanel
        url="http://localhost:3100/mcp"
        connected={false}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    );

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Connect')).toBeInTheDocument();
  });

  it('renders connected state', () => {
    const handleConnect = vi.fn();
    const handleDisconnect = vi.fn();

    render(
      <ConnectionPanel
        url="http://localhost:3100/mcp"
        connected={true}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Disconnect')).toBeInTheDocument();
  });
});