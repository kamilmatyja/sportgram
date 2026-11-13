import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ImageInput } from './ImageInput';
import { render, screen, userEvent, waitFor } from '../../test/test-utils';

function ControlledImageInput(props: { accept?: string; error?: string; disabled?: boolean } = {}) {
    const [value, setValue] = useState<File | null>(null);

    return (
        <ImageInput
            label="Zdjęcie"
            value={value}
            onChange={setValue}
            accept={props.accept}
            error={props.error}
            disabled={props.disabled}
        />
    );
}

describe('ImageInput', () => {
    it('selects an image file and shows its preview and size', async () => {
        const user = userEvent.setup();
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
        const { container } = render(<ControlledImageInput />);
        const fileInput = container.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
        expect(fileInput).toHaveAttribute('accept', 'image/*');

        const file = new File([new Uint8Array(2048)], 'profile.png', { type: 'image/png' });
        await user.upload(fileInput as HTMLInputElement, file);

        expect(await screen.findByText('profile.png')).toBeVisible();
        expect(screen.getByText('2.0 KB')).toBeVisible();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:preview');
    });

    it('passes a custom accepted type to the file picker', () => {
        const { container } = render(<ControlledImageInput accept="image/png" />);

        expect(container.querySelector('input[type="file"]')).toHaveAttribute('accept', 'image/png');
    });

    it('removes a selected image when the delete action is used', async () => {
        const user = userEvent.setup();
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
        const { container } = render(<ControlledImageInput />);
        const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(fileInput, new File(['image data'], 'profile.png', { type: 'image/png' }));

        expect(await screen.findByText('profile.png')).toBeVisible();
        await user.click(screen.getByRole('button', { name: 'Usuń' }));

        await waitFor(() => expect(screen.queryByText('profile.png')).not.toBeInTheDocument());
        expect(screen.getByRole('button', { name: 'Dodaj z dysku' })).toBeVisible();
    });

    it('shows a validation error and disables file selection when requested', () => {
        render(<ControlledImageInput error="Maksymalny rozmiar pliku został przekroczony." disabled />);

        expect(screen.getByText('Maksymalny rozmiar pliku został przekroczony.')).toBeVisible();
        expect(screen.getByRole('button', { name: 'Dodaj z dysku' })).toBeDisabled();
    });
});
