import {useHomeFeeds} from '../services/useHomeFeeds';
import {HomeFeedsView} from '../components/HomeFeedsView';

export default function Home() {
    const feedsService = useHomeFeeds();

    return (
        <HomeFeedsView {...feedsService} />
    );
}