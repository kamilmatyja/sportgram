import { useParams } from 'react-router-dom';
export default function EventDetails() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Szczegóły wydarzenia: {link}</h2></div>;
}