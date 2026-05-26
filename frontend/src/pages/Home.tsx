import {useTranslation} from '../context/TranslationContext';
import {useHomeFeeds} from '../services/useHomeFeeds';
import {HomeFeedsView} from '../components/HomeFeedsView';

export default function Home() {
    const {t} = useTranslation();
    const feedsService = useHomeFeeds();

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">{t('feeds')}</h2>
            <HomeFeedsView {...feedsService} />
        </div>
    );
}