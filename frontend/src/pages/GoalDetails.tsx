import { useParams } from 'react-router-dom';
export default function GoalDetails() {
    const { link } = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Szczegóły celu: {link}</h2></div>;
}