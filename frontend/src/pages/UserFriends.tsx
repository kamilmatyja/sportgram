import {useParams} from 'react-router-dom';

export default function UserFriends() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Znajomi użytkownika: {link}</h2><p className="text-muted">Lista
        znajomych.</p></div>;
}