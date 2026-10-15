import React from 'react';
import { Container } from 'react-bootstrap';

import { UserSubpageHeader } from './UserSubpageHeader';
import { ConversationActivityResponse } from '../../api/responses/ConversationActivityResponse';
import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { ColorEnum } from '../../enums/ColorEnum';
import { type FieldErrors } from '../Common/FormFields';
import { ErrorView, LoadingView } from '../Common/ViewState';
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
    handleSendMessage: (e: React.SyntheticEvent<HTMLFormElement>) => void;
    loadEarlierMessages: () => void;
    fieldErrors?: FieldErrors;
}

export const UserConversationsView: React.FC<UserConversationsViewProps> = (props) => {
    const { targetUser, isMyProfile, loading, error } = props;

    if (loading && !targetUser && !isMyProfile) return <LoadingView />;
    if (error || !targetUser || !props.currentUser) return <ErrorView error={error || 'userNotFound'} />;

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
