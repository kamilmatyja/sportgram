import { useParams } from 'react-router-dom';
export default function UserTrainings() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Treningi użytkownika: {link}</h2><p className="text-muted">Lista treningów i formularz dodawania (Tylko rola Uczestnik).</p></div>;
}