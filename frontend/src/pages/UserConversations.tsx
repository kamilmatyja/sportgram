import {useParams} from 'react-router-dom';
import {useUserConversations} from '../services/useUserConversations';
import {UserConversationsView} from '../components/UserConversationsView';

export default function UserConversations() {
    const {link} = useParams<{ link: string }>();
    const conversationsService = useUserConversations(link);

    return (
        <UserConversationsView
            targetUser={conversationsService.targetUser}
            currentUser={conversationsService.currentUser}
            isMyProfile={conversationsService.isMyProfile}
            loading={conversationsService.loading}
            error={conversationsService.error}

            activities={conversationsService.activities}
            relatedUsers={conversationsService.relatedUsers}
            activityPage={conversationsService.activityPage}
            activityLimit={conversationsService.activityLimit}
            setActivityPage={conversationsService.setActivityPage}
            setActivityLimit={conversationsService.setActivityLimit}

            messages={conversationsService.messages}
            messageInput={conversationsService.messageInput}
            isSending={conversationsService.isSending}
            isTyping={conversationsService.isTyping}
            hasMoreMessages={conversationsService.hasMoreMessages}
            loadingEarlier={conversationsService.loadingEarlier}
            chatEndRef={conversationsService.chatEndRef}
            handleTyping={conversationsService.handleTyping}
            handleSendMessage={conversationsService.handleSendMessage}
            loadEarlierMessages={conversationsService.loadEarlierMessages}
        />
    );
}