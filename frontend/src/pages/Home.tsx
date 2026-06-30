import { HomeFeedsView } from '../components/Home/HomeFeedsView';
import { StoriesCarousel } from '../components/Story/StoriesCarousel';
import { useHomeFeeds } from '../services/Home/useHomeFeeds';

export default function Home() {
    const feedsService = useHomeFeeds();

    return (
        <>
            <StoriesCarousel />
            <HomeFeedsView {...feedsService} />
        </>
    );
}
