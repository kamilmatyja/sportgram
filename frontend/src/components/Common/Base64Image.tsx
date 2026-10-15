import { type ComponentPropsWithoutRef, type FC, type ReactNode } from 'react';
import { Image } from 'react-bootstrap';

type Base64ImageProps = Omit<ComponentPropsWithoutRef<typeof Image>, 'src'> & {
    data: string | null | undefined;
    fallback?: ReactNode;
};

const toImageSrc = (data: string): string => `data:image/webp;base64,${data}`;

export const Base64Image: FC<Base64ImageProps> = ({ data, fallback = null, ...props }) =>
    data ? <Image src={toImageSrc(data)} {...props} /> : <>{fallback}</>;
