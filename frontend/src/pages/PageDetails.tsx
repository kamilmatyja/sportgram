import { useParams } from 'react-router-dom';
export default function PageDetails() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Szczegóły strony: {link}</h2></div>;
}