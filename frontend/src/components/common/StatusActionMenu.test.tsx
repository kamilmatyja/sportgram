import { describe, expect, it, vi } from 'vitest';
import { StatusActionMenu } from './StatusActionMenu';
import { fireEvent, render, screen, userEvent, within } from '../../test/test-utils';

const options = [
    { value: 'draft', label: 'Szkic' },
    { value: 'published', label: 'Opublikowany' },
];

describe('StatusActionMenu', () => {
    it('offers other statuses and calls back with the selected value', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<StatusActionMenu value="draft" options={options} onChange={onChange} tooltipLabel="Zmień status" />);

        await user.click(screen.getByRole('button', { name: 'Zmień status' }));
        const menu = screen.getByRole('menu', { hidden: true });
        expect(within(menu).getByRole('menuitem', { name: 'Szkic', hidden: true })).toBeDisabled();
        fireEvent.click(within(menu).getByRole('menuitem', { name: 'Opublikowany', hidden: true }));

        expect(onChange).toHaveBeenCalledOnce();
        expect(onChange).toHaveBeenCalledWith('published');
    });

    it('disables the action while a status change is pending', () => {
        render(<StatusActionMenu value="draft" options={options} isPending tooltipLabel="Zmień status" />);

        expect(screen.getByRole('button', { name: 'Zmień status' })).toBeDisabled();
    });

    it('disables the current status when it is the only available option', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(
            <StatusActionMenu
                value="draft"
                options={[{ value: 'draft', label: 'Szkic' }]}
                onChange={onChange}
                tooltipLabel="Zmień status"
            />,
        );

        await user.click(screen.getByRole('button', { name: 'Zmień status' }));

        expect(onChange).not.toHaveBeenCalled();
    });

    it('renders an empty menu when no status actions are available', async () => {
        const user = userEvent.setup();
        render(<StatusActionMenu value="draft" options={[]} tooltipLabel="Zmień status" />);

        await user.click(screen.getByRole('button', { name: 'Zmień status' }));

        expect(screen.queryByRole('menuitem', { hidden: true })).not.toBeInTheDocument();
    });
});
