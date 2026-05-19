import { useParams } from 'react-router-dom';
export default function EventResults() {
    const { link, discipline, distance } = useParams<{ link: string, discipline: string, distance: string }>();
    return <div className="container mt-5">
        <h2>Wyniki wydarzenia</h2>
        <p className="text-muted">Wydarzenie: {link} | Dyscyplina: {discipline} | Dystans: {distance}</p>
        <p>Przycisk wprowadzania wyników (tylko dla Organizatora).</p>
    </div>;
}