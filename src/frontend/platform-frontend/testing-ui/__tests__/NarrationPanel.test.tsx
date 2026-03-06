// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { NarrationPanel } from '../../core-logic/NarrationPanel';

describe('NarrationPanel', () => {
  it('renders text and clickable refs', () => {
    const handleRefClick = vi.fn();

    render(
      <NarrationPanel
        text={'[button "Submit" ref=123] and [link "Home" ref=456]'}
        onRefClick={handleRefClick}
        isCalling={false}
      />
    );

    const submitBtn = screen.getByTitle('Click element #123');
    expect(submitBtn).toBeInTheDocument();

    fireEvent.click(submitBtn);
    expect(handleRefClick).toHaveBeenCalledWith(123);
  });

  it('renders empty state', () => {
    render(
      <NarrationPanel
        text={''}
        onRefClick={vi.fn()}
        isCalling={false}
      />
    );

    expect(screen.getByText(/No narration available/)).toBeInTheDocument();
  });
});