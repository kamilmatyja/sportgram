import {useParams} from 'react-router-dom';
import {useGoalDetails} from '../services/useGoalDetails';
import {GoalDetailsView} from '../components/GoalDetailsView';

export default function GoalDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useGoalDetails(link);

    return <GoalDetailsView {...detailsProps} />;
}