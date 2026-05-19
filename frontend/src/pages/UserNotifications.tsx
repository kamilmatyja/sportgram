import {useParams} from 'react-router-dom';

export default function UserNotifications() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Powiadomienia: {link}</h2><p className="text-muted">Skrzynka powiadomień
        użytkownika.</p></div>;
}