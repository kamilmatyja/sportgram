import {useParams} from 'react-router-dom';
import {usePageDetails} from '../services/usePageDetails';
import {PageDetailsView} from '../components/PageDetailsView';

export default function PageDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = usePageDetails(link);

    return <PageDetailsView {...detailsProps} />;
}