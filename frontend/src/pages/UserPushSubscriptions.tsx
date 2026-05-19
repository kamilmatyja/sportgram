import { useParams } from 'react-router-dom';
export default function UserPushSubscriptions() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Subskrypcje Push: {link}</h2><p className="text-muted">Zarządzanie przeglądarkami do odbierania powiadomień.</p></div>;
}