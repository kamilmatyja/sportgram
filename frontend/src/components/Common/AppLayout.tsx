import React from 'react';
import { Container } from 'react-bootstrap';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <Container fluid className="min-vh-100 p-0">
        {children}
    </Container>
);

export default AppLayout;
