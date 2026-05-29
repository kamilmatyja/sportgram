import {useHomeFeeds} from '../services/Home/useHomeFeeds';
import {HomeFeedsView} from '../components/Home/HomeFeedsView';
import {StoriesCarousel} from '../components/Story/StoriesCarousel';

export default function Home() {
    const feedsService = useHomeFeeds();

    return (
        <>
            <StoriesCarousel />
            <HomeFeedsView {...feedsService} />
        </>
    );
}