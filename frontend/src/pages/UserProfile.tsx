import {useParams} from 'react-router-dom';
import {useUserProfile} from '../services/useUserProfile';
import {UserProfileView} from '../components/UserProfileView';

export default function UserProfile() {
    const {link} = useParams<{ link: string }>();
    const profileProps = useUserProfile(link);

    return <UserProfileView {...profileProps} />;
}