import {useParams} from 'react-router-dom';

export default function UserGoals() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Cele użytkownika: {link}</h2><p className="text-muted">Lista celów i
        formularz dodawania (Tylko rola Uczestnik).</p></div>;
}