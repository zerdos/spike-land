import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { InteractivePrompts } from '../InteractivePrompts';

describe('InteractivePrompts', () => {
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<InteractivePrompts onEdit={mockOnEdit} />);
    expect(screen.getByText(/Try the/i)).toBeInTheDocument();

    // There are multiple "Neural" texts (one per card + the main title)
    // We just want to make sure it exists
    const neuralElements = screen.getAllByText(/Neural/i);
    expect(neuralElements.length).toBeGreaterThan(0);
  });

  it('handles click and state transitions', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<InteractivePrompts onEdit={mockOnEdit} />);

    // Initial state: spark icon present, 'done' elements not visible
    const firstPrompt = screen.getByText(/"A neon-lit cyberpunk street market with rain reflecting vibrant pink and cyan lights, cinematic 8k resolution, photorealistic"/i);
    expect(firstPrompt).toBeInTheDocument();

    const firstCard = firstPrompt.closest('div.group');
    expect(firstCard).toBeInTheDocument();

    // Click the card
    fireEvent.click(firstCard!);

    // Check loading state
    const loadingTexts = screen.getAllByText(/Neural Flux.../i);
    expect(loadingTexts.length).toBeGreaterThan(0);

    // Fast-forward timers
    act(() => {
      vi.runAllTimers();
    });

    // Check done state - 'Edit in Studio' button should now be visible
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /Edit in Studio/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    vi.useRealTimers();
  });

  it('calls onEdit with correct arguments when edit button is clicked', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<InteractivePrompts onEdit={mockOnEdit} />);

    const firstPrompt = screen.getByText(/"A neon-lit cyberpunk street market with rain reflecting vibrant pink and cyan lights, cinematic 8k resolution, photorealistic"/i);
    const firstCard = firstPrompt.closest('div.group');

    // Click the card
    fireEvent.click(firstCard!);

    // Fast-forward timers to complete the animation
    act(() => {
      vi.runAllTimers();
    });

    // Click the edit button
    const editButtons = await waitFor(() => screen.getAllByRole('button', { name: /Edit in Studio/i }));
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(
      "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop",
      "A neon-lit cyberpunk street market with rain reflecting vibrant pink and cyan lights, cinematic 8k resolution, photorealistic"
    );

    vi.useRealTimers();
  });
});
