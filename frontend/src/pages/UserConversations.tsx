import {useParams} from 'react-router-dom';
import {useUserConversations} from '../services/Conversation/useUserConversations';
import {UserConversationsView} from '../components/User/UserConversationsView';

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
            totalActivities={conversationsService.totalActivities}
            activityPage={conversationsService.activityPage}
            activityLimit={conversationsService.activityLimit}
            activitySort={conversationsService.activitySort}
            activitySearch={conversationsService.activitySearch}
            setActivityPage={conversationsService.setActivityPage}
            setActivityLimit={conversationsService.setActivityLimit}
            setActivitySort={conversationsService.setActivitySort}
            setActivitySearch={conversationsService.setActivitySearch}

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