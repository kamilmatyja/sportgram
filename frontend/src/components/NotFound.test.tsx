import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router-dom';
import NotFound from './NotFound';
import { render, screen, userEvent } from '../test/test-utils';

function LocationPath() {
    const location = useLocation();
    return <output aria-label="current location">{location.pathname}</output>;
}

describe('NotFound', () => {
    it('shows the 404 view with supplied title and message', () => {
        render(<NotFound title="Nie znaleziono strony" message="Podany adres jest nieprawidłowy." />);

        expect(screen.getByText('404')).toBeVisible();
        expect(screen.getByText('Nie znaleziono strony')).toBeVisible();
        expect(screen.getByText('Podany adres jest nieprawidłowy.')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Kokpit' })).toBeVisible();
    });

    it('navigates to the home page when the home action is selected', async () => {
        const user = userEvent.setup();
        render(
            <>
                <NotFound title="Strona niedostępna" message="Spróbuj wrócić do kokpitu." />
                <LocationPath />
            </>,
            { initialEntries: ['/missing'] },
        );

        expect(screen.getByLabelText('current location')).toHaveTextContent('/missing');
        await user.click(screen.getByRole('button', { name: 'Kokpit' }));
        expect(screen.getByLabelText('current location')).toHaveTextContent('/');
    });
});
