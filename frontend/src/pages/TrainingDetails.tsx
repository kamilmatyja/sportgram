import {useParams} from 'react-router-dom';
import {useTrainingDetails} from '../services/useTrainingDetails';
import {TrainingDetailsView} from '../components/TrainingDetailsView';

export default function TrainingDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useTrainingDetails(link);

    return <TrainingDetailsView {...detailsProps} />;
}