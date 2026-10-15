import { type FC } from 'react';
import { Alert, Container, Spinner } from 'react-bootstrap';

import { useTranslation } from '../../context/TranslationContext';

export const LoadingView: FC = () => (
    <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" role="status" />
    </Container>
);

export const ErrorView: FC<{ error: string }> = ({ error }) => {
    const { t } = useTranslation();

    return (
        <Container className="mt-5">
            <Alert variant="danger">{t(error)}</Alert>
        </Container>
    );
};
