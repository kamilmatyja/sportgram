import { useParams } from 'react-router-dom';
export default function UserConversations() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Wiadomości / Aktywności: {link}</h2><p className="text-muted">Lista wiadomości między mną a {link} lub lista aktywności.</p></div>;
}