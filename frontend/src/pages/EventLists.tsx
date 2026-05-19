import { useParams } from 'react-router-dom';
export default function EventLists() {
    const { link, discipline, distance } = useParams<{ link: string, discipline: string, distance: string }>();
    return <div className="container mt-5">
        <h2>Listy startowe</h2>
        <p className="text-muted">Wydarzenie: {link} | Dyscyplina: {discipline} | Dystans: {distance}</p>
        <p>Przycisk do zapisania się (tylko dla Uczestnika).</p>
    </div>;
}