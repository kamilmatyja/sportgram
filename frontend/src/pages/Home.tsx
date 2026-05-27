import {useHomeFeeds} from '../services/Home/useHomeFeeds';
import {HomeFeedsView} from '../components/Home/HomeFeedsView';

export default function Home() {
    const feedsService = useHomeFeeds();

    return (
        <HomeFeedsView {...feedsService} />
    );
}