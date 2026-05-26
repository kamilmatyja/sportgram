import React from 'react';
import {useTranslation} from '../context/TranslationContext';
import {UserResponse} from '../api/responses/UserResponse';
import {ConversationResponse} from '../api/responses/ConversationResponse';
import {ColorEnum} from '../enums/ColorEnum';
import {PaginationEnum} from '../enums/PaginationEnum';
import {formatDate} from '../utils/dateFormat';
import {ProcessedActivity} from '../services/useUserConversations';

interface UserConversationsViewProps {
    targetUser: UserResponse | null;
    currentUser: UserResponse | null;
    isMyProfile: boolean;
    loading: boolean;
    error: string | null;

    activities: ProcessedActivity[];
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

    if (loading && !targetUser && !isMyProfile) return <div className="container mt-5 text-center">
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
                </div>

                <div className="mb-3 d-flex flex-wrap gap-3 align-items-center">
                    <input
                        type="text"
                        placeholder={t('search')}
                        value={activitySearch}
                        onChange={e => {
                            setActivitySearch(e.target.value);
                            setActivityPage(1);
                        }}
                        className="form-control w-auto"
                    />
                    <select value={activitySort} onChange={e => {
                        setActivitySort(e.target.value);
                        setActivityPage(1);
                    }} className="form-select w-auto ms-auto">
                        <option value="updatedAt:desc">{t('sortCreatedDesc')}</option>
                        <option value="updatedAt:asc">{t('sortCreatedAsc')}</option>
                        <option value="user:asc">{t('sortUserAsc')}</option>
                        <option value="user:desc">{t('sortUserDesc')}</option>
                    </select>
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
                        <div className="table-responsive-custom mb-3">
                            <table className="table table-bordered table-hover align-middle">
                                <thead className="table-light">
                                <tr>
                                    <th>{t('photo')}</th>
                                    <th>{t('user')}</th>
                                    <th>{t('link')}</th>
                                    <th>{t('lastActivity')}</th>
                                    <th></th>
                                </tr>
                                </thead>
                                <tbody>
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center text-muted">{t('noConversations')}</td>
                                    </tr>
                                ) : activities.map(act => (
                                    <tr key={act.otherUser.id}>
                                        <td className="text-center align-middle feed-photo-cell">
                                            {act.otherUser.profilePhoto ? (
                                                <img src={`data:image/webp;base64,${act.otherUser.profilePhoto}`}
                                                     alt="avatar" className="rounded-circle img-fluid feed-photo"/>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <a href={`/users/${act.otherUser.link}`}
                                               className="btn btn-link p-0 text-decoration-none">
                                                {act.otherUser.firstName} {act.otherUser.lastName}
                                            </a>
                                        </td>
                                        <td>@{act.otherUser.link}</td>
                                        <td>{formatDate(act.updatedAt)}</td>
                                        <td className="text-end">
                                            <a href={`/users/${act.otherUser.link}/conversations`} title={t('chat')}
                                               className="btn btn-sm btn-profile-outline-primary">
                                                <i className="bi bi-chat-dots me-1"></i>
                                                <span className="visually-hidden">{t('chat')}</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                            <button className="btn btn-profile-outline-primary mx-2" disabled={activityPage === 1}
                                    onClick={() => setActivityPage(Math.max(activityPage - 1, 1))}>{t('prev')}</button>
                            <span>{t('page')} {activityPage}</span>
                            <button className="btn btn-profile-outline-primary mx-2"
                                    disabled={activityPage * activityLimit >= totalActivities}
                                    onClick={() => setActivityPage(activityPage + 1)}>{t('next')}</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );

    const renderChat = () => (
        <div className="card shadow-sm d-flex flex-column chat-card-container">
            <div className="card-header bg-light d-flex align-items-center gap-3">
                <img src={`data:image/webp;base64,${targetUser.profilePhoto}`} alt="avatar"
                     className="rounded-circle object-fit-cover" width={40} height={40}/>
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
                        placeholder={t('typeMessage')}
                        value={messageInput}
                        onChange={handleTyping}
                        disabled={isSending}
                    />
                    <button type="submit"
                            className="btn btn-profile-primary rounded-circle d-flex align-items-center justify-content-center"
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