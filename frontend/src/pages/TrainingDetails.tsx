import {useParams} from 'react-router-dom';

export default function TrainingDetails() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Szczegóły treningu: {link}</h2></div>;
}