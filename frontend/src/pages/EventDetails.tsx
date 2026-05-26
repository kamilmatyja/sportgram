import {useParams} from 'react-router-dom';
import {useEventDetails} from '../services/useEventDetails';
import {EventDetailsView} from '../components/EventDetailsView';

export default function EventDetails() {
    const {link} = useParams<{ link: string }>();
    const detailsProps = useEventDetails(link);

    return <EventDetailsView {...detailsProps} />;
}