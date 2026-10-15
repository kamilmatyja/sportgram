import React from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';

interface AuthCardProps {
    title: React.ReactNode;
    wide?: boolean;
    children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ title, wide = false, children }) => (
    <Container className="py-5">
        <Row className="justify-content-center">
            <Col md={wide ? 10 : 8} lg={wide ? 7 : 5} xl={wide ? 6 : 4}>
                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <Card.Title as="h2" className="text-center mb-4">
                            {title}
                        </Card.Title>
                        {children}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    </Container>
);
