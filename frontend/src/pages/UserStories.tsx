import {useParams} from 'react-router-dom';

export default function UserStories() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Relacje użytkownika: {link}</h2><p className="text-muted">Lista i
        formularz dodawania relacji (Stories).</p></div>;
}