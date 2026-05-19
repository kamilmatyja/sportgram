import { useParams } from 'react-router-dom';
export default function UserSettings() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Ustawienia: {link}</h2><p className="text-muted">Formularz edycji danych użytkownika.</p></div>;
}