import React from 'react';
import {Container} from 'react-bootstrap';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({children}) => {
    return (
        <Container fluid className="min-vh-100 bg-body text-body p-0 m-0">
            {children}
        </Container>
    );
};

export default AppLayout;