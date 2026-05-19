import {useParams} from 'react-router-dom';

export default function UserFeeds() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Wpisy użytkownika: {link}</h2><p className="text-muted">Lista i formularz
        dodawania wpisów.</p></div>;
}