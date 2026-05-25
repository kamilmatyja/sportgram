import React from 'react';
import {useTranslation} from '../context/TranslationContext.tsx';
import {UserResponse} from '../api/responses/UserResponse.ts';
import {ConversationActivityResponse} from '../api/responses/ConversationActivityResponse.ts';
import {ConversationResponse} from '../api/responses/ConversationResponse.ts';
import {ColorEnum} from '../enums/ColorEnum.ts';
import {PaginationEnum} from '../enums/PaginationEnum.ts';
import {formatDate} from '../utils/dateFormat.ts';

interface UserConversationsViewProps {
    targetUser: UserResponse | null;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;

    activities: ConversationActivityResponse[];
    relatedUsers: Record<string, UserResponse>;
    activityPage: number;
    activityLimit: number;
    setActivityPage: (page: number) => void;
    setActivityLimit: (limit: number) => void;

    messages: ConversationResponse[];
    messageInput: string;
    isSending: boolean;
    isTyping: boolean;
    hasMoreMessages: boolean;
    loadingEarlier: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendMessage: (e: React.ChangeEvent) => void;
    loadEarlierMessages: () => void;
}

export const UserConversationsView: React.FC<UserConversationsViewProps> = ({
                                                                                targetUser,
                                                                                currentUser,
                                                                                isMyProfile,
                                                                                loading,
                                                                                error,
                                                                                activities,
                                                                                relatedUsers,
                                                                                activityPage,
                                                                                activityLimit,
                                                                                setActivityPage,
                                                                                setActivityLimit,
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

    if (loading && !targetUser) return <div className="container mt-5 text-center">
        <div className="spinner-border"/>
    </div>;

    if (error || !targetUser || !currentUser) return <div
        className="container mt-5 alert alert-danger">{error ? t(error) : t('userNotFound')}</div>;

    const hexColor = ColorEnum.getHex(targetUser.color);

    const renderActivityList = () => (
        <div className="card shadow-sm">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">{t('conversationsList')}</h4>
                    <select value={activityLimit} onChange={e => {
                        setActivityLimit(Number(e.target.value));
                        setActivityPage(1);
                    }} className="form-select w-auto">
                        {PaginationEnum.getOptions(t).map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {loading ? <div className="text-center">
                    <div className="spinner-border"/>
                </div> : (
                    <>
                        <div className="list-group mb-3">
                            {activities.length === 0 ? (
                                <div className="text-center text-muted py-4">{t('noConversations')}</div>
                            ) : activities.map(act => {
                                const otherUserId = act.senderUserId === currentUser.id ? act.receiverUserId : act.senderUserId;
                                const otherUser = relatedUsers[otherUserId];

                                if (!otherUser) return null;

                                return (
                                    <a key={act.id} href={`/users/${otherUser.link}/conversations`}
                                       className="list-group-item list-group-item-action d-flex align-items-center gap-3">
                                        <img src={`data:image/webp;base64,${otherUser.profilePhoto}`} alt="avatar"
                                             className="rounded-circle object-fit-cover" width={50} height={50}/>
                                        <div className="flex-grow-1">
                                            <h6 className="mb-0 fw-bold"
                                                style={{color: ColorEnum.getHex(otherUser.color)}}>{otherUser.firstName} {otherUser.lastName}</h6>
                                            <small
                                                className="text-muted">{t('lastActivity')}: {formatDate(act.updatedAt)}</small>
                                        </div>
                                        <i className="bi bi-chevron-right text-muted"></i>
                                    </a>
                                );
                            })}
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <button className="btn btn-profile-outline-primary" disabled={activityPage === 1}
                                    onClick={() => setActivityPage(Math.max(activityPage - 1, 1))}>{t('prev')}</button>
                            <span>{t('page')} {activityPage}</span>
                            <button className="btn btn-profile-outline-primary"
                                    disabled={activities.length < activityLimit}
                                    onClick={() => setActivityPage(activityPage + 1)}>{t('next')}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="card shadow-sm d-flex flex-column" style={{height: '600px'}}>
            <div className="card-header bg-light d-flex align-items-center gap-3">
                <img src={`data:image/webp;base64,${targetUser.profilePhoto}`} alt="avatar"
                     className="rounded-circle object-fit-cover" width={40} height={40}/>
                <div>
                    <h6 className="mb-0 fw-bold"
                        style={{color: hexColor}}>{targetUser.firstName} {targetUser.lastName}</h6>
                    {isTyping && <small className="text-profile-primary">{t('isTyping')}...</small>}
                </div>
            </div>

            <div className="card-body overflow-auto d-flex flex-column gap-2 bg-light bg-opacity-50">
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
                                className={`p-2 px-3 rounded-3 text-break shadow-sm ${isMine ? 'profile-theme-bg' : 'bg-white border'}`}
                                style={{maxWidth: '75%'}}>
                                {msg.text}
                            </div>
                            <small className="text-muted mt-1"
                                   style={{fontSize: '0.7rem'}}>{formatDate(msg.createdAt)}</small>
                        </div>
                    );
                })}
                <div ref={chatEndRef}/>
            </div>

            <div className="card-footer bg-white">
                <form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('typeMessage')}
                        value={messageInput}
                        onChange={handleTyping}
                        disabled={isSending}
                    />
                    <button type="submit" className="btn btn-profile-primary px-4"
                            disabled={!messageInput.trim() || isSending}>
                        {isSending ? <div className="spinner-border spinner-border-sm"/> :
                            <i className="bi bi-send-fill"></i>}
                    </button>
                </form>
            </div>
        </div>
    );

    return (
        <div className="container mt-4 mb-5" style={{'--theme-color': hexColor} as React.CSSProperties}>
            <div className="card shadow-sm mb-4">
                <div
                    className="card-img-top bg-secondary position-relative overflow-hidden border-top border-4 profile-theme-border profile-bg-container">
                    <img src={`data:image/webp;base64,${targetUser.backgroundPhoto}`} alt="Background"
                         className="w-100 h-100 object-fit-cover"/>
                </div>
                <div className="card-body position-relative pt-5">
                    <img src={`data:image/webp;base64,${targetUser.profilePhoto}`} alt="Profile"
                         className="rounded-circle border border-4 profile-theme-border bg-white position-absolute profile-avatar object-fit-cover"/>
                    <div className="mt-3">
                        <h2 className="mb-0 profile-theme-text">{targetUser.firstName} {targetUser.lastName}</h2>
                        <p className="text-muted mb-0">@{targetUser.link}</p>
                    </div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3 overflow-x-auto">
                <a href={`/users/${targetUser.link}`} className="btn btn-profile-outline-primary">
                    <i className="bi bi-arrow-left me-1"></i> {t('profile')}
                </a>
            </div>

            {isMyProfile ? renderActivityList() : renderChat()}

        </div>
    );
};