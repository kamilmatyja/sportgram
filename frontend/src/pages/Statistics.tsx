import {useStatistics} from '../services/Statistics/useStatistics';
import {StatisticsView} from '../components/Statistics/StatisticsView';

export default function Statistics() {
    const statsService = useStatistics();

    return <StatisticsView {...statsService} />;
}