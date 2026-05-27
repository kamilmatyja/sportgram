import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {ConversationResponse} from '../../api/responses/ConversationResponse';
import {formatDate} from '../../utils/dateFormat';

interface ChatWindowProps {
    targetUser: UserResponse;
    currentUser: UserResponse;
    messages: ConversationResponse[];
    messageInput: string;
    isSending: boolean;
    isTyping: boolean;
    hasMoreMessages: boolean;
    loadingEarlier: boolean;
    canSendMessages: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendMessage: (e: React.ChangeEvent<HTMLFormElement>) => void;
    loadEarlierMessages: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
                                                          targetUser,
                                                          currentUser,
                                                          messages,
                                                          messageInput,
                                                          isSending,
                                                          isTyping,
                                                          hasMoreMessages,
                                                          loadingEarlier,
                                                          canSendMessages,
                                                          chatEndRef,
                                                          handleTyping,
                                                          handleSendMessage,
                                                          loadEarlierMessages
                                                      }) => {
    const {t} = useTranslation();

    return (
        <div className="card shadow-sm d-flex flex-column chat-card-container">
            <div className="card-header bg-light d-flex align-items-center gap-3">
                {targetUser.profilePhoto ? (
                    <img src={`data:image/webp;base64,${targetUser.profilePhoto}`} alt="avatar"
                         className="rounded-circle object-fit-cover feed-avatar-32"/>
                ) : (
                    <div className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32"></div>
                )}
                <div>
                    <h6 className="mb-0 fw-bold">{targetUser.firstName} {targetUser.lastName}</h6>
                    <div>
                        {isTyping && <small className="text-profile-primary fst-italic">{t('isTyping')}...</small>}
                    </div>
                </div>
            </div>

            <div className="card-body chat-body-scrollable d-flex flex-column gap-2 bg-light bg-opacity-50">
                {hasMoreMessages && (
                    <div className="text-center mb-3">
                        <button className="btn btn-sm btn-outline-secondary" onClick={loadEarlierMessages}
                                disabled={loadingEarlier}>
                            {loadingEarlier ? <div className="spinner-border spinner-border-sm"/> : t('loadEarlier')}
                        </button>
                    </div>
                )}

                {[...messages].reverse().map(msg => {
                    const isMine = msg.senderUserId === currentUser.id;
                    return (
                        <div key={msg.id}
                             className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}>
                            <div
                                className={`p-2 px-3 rounded-3 text-break shadow-sm ${isMine ? 'profile-theme-bg' : 'bg-white border'}`}>
                                {msg.text}
                            </div>
                            <small className="text-muted mt-1">{formatDate(msg.createdAt)}</small>
                        </div>
                    );
                })}
                <div ref={chatEndRef}/>
            </div>

            <div className="card-footer bg-white border-top-0 pt-3 pb-3">
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input
                        type="text"
                        className="form-control rounded-pill px-4"
                        placeholder={canSendMessages ? t('typeMessage') : t('mustBeFriendsToChat')}
                        value={messageInput}
                        onChange={handleTyping}
                        disabled={isSending || !canSendMessages}
                    />
                    <button type="submit"
                            className="btn btn-profile-primary rounded-circle d-flex align-items-center justify-content-center"
                            disabled={!messageInput.trim() || isSending || !canSendMessages}>
                        {isSending ? <div className="spinner-border spinner-border-sm"/> :
                            <i className="bi bi-send-fill"></i>}
                    </button>
                </form>
            </div>
        </div>
    );
};