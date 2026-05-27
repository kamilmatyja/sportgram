import {useStatistics} from '../services/useStatistics';
import {StatisticsView} from '../components/StatisticsView';

export default function Statistics() {
    const statsService = useStatistics();

    return <StatisticsView {...statsService} />;
}