import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {ConversationResponse} from '../../api/responses/ConversationResponse';
import {ConversationActivityResponse} from '../../api/responses/ConversationActivityResponse';
import {ColorEnum} from '../../enums/ColorEnum';
import {UserSubpageHeader} from './UserSubpageHeader';
import {ConversationActivityList} from '../Conversation/ConversationActivityList';
import {ChatWindow} from '../Conversation/ChatWindow';

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
            <div className="container mt-5 text-center">
                <div className="spinner-border text-profile-primary"/>
            </div>
        );
    }

    if (error || !targetUser || !currentUser) {
        return (
            <div className="container mt-5 alert alert-danger">
                {error ? t(error) : t('userNotFound')}
            </div>
        );
    }

    const themeClass = ColorEnum.getClass(targetUser.color);

    return (
        <div className={`container mt-4 mb-5 ${themeClass}`}>
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
        </div>
    );
};