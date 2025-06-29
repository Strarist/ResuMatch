import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from '../Hero';

describe('Hero', () => {
  it('renders the main heading and CTA buttons', () => {
    render(<Hero />);
    expect(screen.getByText(/AI-Powered Resume Matcher/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Upload Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to Dashboard/i })).toBeInTheDocument();
  });
}); 