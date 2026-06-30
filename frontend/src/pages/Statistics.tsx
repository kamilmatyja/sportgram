import { StatisticsView } from '../components/Statistics/StatisticsView';
import { useStatistics } from '../services/Statistics/useStatistics';

export default function Statistics() {
    const statsService = useStatistics();

    return <StatisticsView {...statsService} />;
}
