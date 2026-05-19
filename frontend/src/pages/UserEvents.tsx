import {useParams} from 'react-router-dom';

export default function UserEvents() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Wydarzenia użytkownika: {link}</h2><p className="text-muted">Lista
        wydarzeń i formularz dodawania (Tylko rola Organizator).</p></div>;
}