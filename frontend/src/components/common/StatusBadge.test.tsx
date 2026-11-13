import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';
import { render, screen } from '../../test/test-utils';

const statuses = {
    getOptions: () => [
        { value: 1, label: 'Szkic' },
        { value: 2, label: 'Aktywny' },
    ],
};

describe('StatusBadge', () => {
    it('shows the label for the current status', () => {
        render(<StatusBadge status={2} enumType={statuses} />);

        expect(screen.getByText('Aktywny')).toBeVisible();
    });

    it('falls back to the status value when it has no matching label', () => {
        render(<StatusBadge status="archived" enumType={statuses} />);

        expect(screen.getByText('archived')).toBeVisible();
    });

    it('uses an explicitly provided label instead of resolving the status', () => {
        render(<StatusBadge status={1} label="Własna etykieta" enumType={statuses} />);

        expect(screen.getByText('Własna etykieta')).toBeVisible();
        expect(screen.queryByText('Szkic')).not.toBeInTheDocument();
    });
});
