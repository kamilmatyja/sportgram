import {useParams} from 'react-router-dom';
import {useUserSettings} from '../services/useUserSettings';
import {UserSettingsView} from '../components/UserSettingsView';

export default function UserSettings() {
    const {link} = useParams<{ link: string }>();
    const settingsProps = useUserSettings(link);

    return <UserSettingsView {...settingsProps} />;
}