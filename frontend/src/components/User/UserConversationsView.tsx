import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {ConversationResponse} from '../../api/responses/ConversationResponse';
import {ConversationActivityResponse} from '../../api/responses/ConversationActivityResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {ConversationActivityList} from '../Conversation/ConversationActivityList';
import {ChatWindow} from '../Conversation/ChatWindow';
import {Container, Spinner, Alert} from 'react-bootstrap';

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

export const UserConversationsView: React.FC<UserConversationsViewProps> = ({
                                                                                targetUser,
                                                                                currentUser,
                                                                                isMyProfile,
                                                                                canSendMessages,
                                                                                loading,
                                                                                error,
                                                                                activities,
                                                                                totalActivities,
                                                                                activityPage,
                                                                                activityLimit,
                                                                                activitySort,
                                                                                activitySearch,
                                                                                setActivityPage,
                                                                                setActivityLimit,
                                                                                setActivitySort,
                                                                                setActivitySearch,
                                                                                messages,
                                                                                messageInput,
                                                                                isSending,
                                                                                isTyping,
                                                                                hasMoreMessages,
                                                                                loadingEarlier,
                                                                                chatEndRef,
                                                                                handleTyping,
                                                                                handleSendMessage,
                                                                                loadEarlierMessages
                                                                            }) => {
    const {t} = useTranslation();

    if (loading && !targetUser && !isMyProfile) {
        return (
            <Container className="mt-5 text-center">
                <Spinner animation="border" className="text-profile-primary" />
            </Container>
        );
    }

    if (error || !targetUser || !currentUser) {
        return (
            <Container className="mt-5">
                <Alert variant="danger">
                    {error ? t(error) : t('userNotFound')}
                </Alert>
            </Container>
        );
    }

    const themeClass = ColorEnum.getClass(targetUser.color);

    return (
        <Container className={`mt-4 mb-5 ${themeClass}`}>
            <UserSubpageHeader user={targetUser}/>

            {isMyProfile ? (
                <ConversationActivityList
                    activities={activities}
                    totalActivities={totalActivities}
                    activityPage={activityPage}
                    activityLimit={activityLimit}
                    activitySort={activitySort}
                    activitySearch={activitySearch}
                    loading={loading}
                    setActivityPage={setActivityPage}
                    setActivityLimit={setActivityLimit}
                    setActivitySort={setActivitySort}
                    setActivitySearch={setActivitySearch}
                />
            ) : (
                <ChatWindow
                    targetUser={targetUser}
                    currentUser={currentUser}
                    messages={messages}
                    messageInput={messageInput}
                    isSending={isSending}
                    isTyping={isTyping}
                    hasMoreMessages={hasMoreMessages}
                    loadingEarlier={loadingEarlier}
                    chatEndRef={chatEndRef}
                    handleTyping={handleTyping}
                    handleSendMessage={handleSendMessage}
                    loadEarlierMessages={loadEarlierMessages}
                    canSendMessages={canSendMessages}
                />
            )}
        </Container>
    );
};