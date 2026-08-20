import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from './JobCard';
import type { Job } from '../types';

const baseJob: Job = {
  id: '1',
  source: 'RemoteOK',
  title: 'Senior Backend Engineer',
  company: 'Acme Co',
  companyLogoUrl: null,
  description: 'desc',
  stack: ['node'],
  location: 'Worldwide',
  remoteType: 'remote',
  contractType: 'full-time',
  compensation: null,
  sourceUrl: 'https://example.com/job',
  postedAt: null,
  fetchedAt: '2026-08-20T00:00:00.000Z',
  level: 'senior',
};

describe('JobCard', () => {
  it('shows the level badge when level is present', () => {
    render(<JobCard job={baseJob} onSelect={vi.fn()} />);
    expect(screen.getByText('Senior')).toBeInTheDocument();
  });

  it('hides the level badge when level is null', () => {
    render(<JobCard job={{ ...baseJob, level: null }} onSelect={vi.fn()} />);
    expect(screen.queryByText('Senior')).not.toBeInTheDocument();
    expect(screen.queryByText('Junior')).not.toBeInTheDocument();
  });

  it('marks a hybrid remote type with the warning pill class', () => {
    render(
      <JobCard job={{ ...baseJob, remoteType: 'hybrid' }} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('Hybrid')).toHaveClass(
      'job-card__remote-pill--warn',
    );
  });

  it('marks an onsite remote type with the warning pill class', () => {
    render(
      <JobCard job={{ ...baseJob, remoteType: 'onsite' }} onSelect={vi.fn()} />,
    );
    expect(screen.getByText('On-site')).toHaveClass(
      'job-card__remote-pill--warn',
    );
  });

  it('does not mark a remote job with the warning pill class', () => {
    render(<JobCard job={baseJob} onSelect={vi.fn()} />);
    expect(screen.getByText('Remote')).not.toHaveClass(
      'job-card__remote-pill--warn',
    );
  });

  it('calls onSelect with the job when clicked', () => {
    const onSelect = vi.fn();
    render(<JobCard job={baseJob} onSelect={onSelect} />);
    screen.getByRole('button').click();
    expect(onSelect).toHaveBeenCalledWith(baseJob);
  });

  it('renders company initials when no logo is available', () => {
    render(<JobCard job={baseJob} onSelect={vi.fn()} />);
    expect(screen.getByText('AC')).toBeInTheDocument();
  });
});
