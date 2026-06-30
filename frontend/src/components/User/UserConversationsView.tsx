import React from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { ColorEnum } from '../../enums/ColorEnum';
import { ChatWindow } from '../Conversation/ChatWindow';
import { ConversationActivityList } from '../Conversation/ConversationActivityList';

interface UserConversationsViewProps {
    targetUser: UserResponse | null;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    canSendMessages: boolean;
    loading: boolean;
    error: string | null;
    activities: (ConversationActivityResponse & { otherUser: UserResponse })[];
    totalActivities: number;
    activityPage: number;
    activityLimit: number;
    activitySort: string;
    activitySearch: string;
    setActivityPage: (page: number) => void;
    setActivityLimit: (limit: number) => void;
    setActivitySort: (sort: string) => void;
    setActivitySearch: (search: string) => void;
    messages: ConversationResponse[];
    messageInput: string;
    isSending: boolean;
    isTyping: boolean;
    hasMoreMessages: boolean;
    loadingEarlier: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendMessage: (e: React.ChangeEvent<HTMLFormElement>) => void;
    loadEarlierMessages: () => void;
}

export const UserConversationsView: React.FC<UserConversationsViewProps> = (props) => {
    const { t } = useTranslation();
    const { targetUser, isMyProfile, loading, error } = props;

    if (loading && !targetUser && !isMyProfile)
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    if (error || !targetUser || !props.currentUser)
        return (
            <Container className="mt-5">
                <Alert variant="danger">{error ? t(error) : t('userNotFound')}</Alert>
            </Container>
        );

    const themeClass = ColorEnum.getClass(targetUser.color);

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={targetUser} />
            {isMyProfile ? (
                <ConversationActivityList {...props} paginationVariant="profile-outline-primary" />
            ) : (
                <ChatWindow {...props} targetUser={targetUser} currentUser={props.currentUser} />
            )}
        </Container>
    );
};
