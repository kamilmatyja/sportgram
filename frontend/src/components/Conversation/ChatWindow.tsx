import React from 'react';
import { Card, Stack, Form, Button, Spinner } from 'react-bootstrap';

import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import { formatDate } from '../../utils/dateFormat';
import { formatUserName } from '../../utils/user';
import BootstrapIcon from '../Common/BootstrapIcon';
import { type FieldErrors, InputField } from '../Common/FormFields';
import { UserAvatar } from '../Common/UserAvatar';

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
    fieldErrors?: FieldErrors;
    handleTyping: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSendMessage: (e: React.SyntheticEvent<HTMLFormElement>) => void;
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
    fieldErrors = {},
    handleTyping,
    handleSendMessage,
    loadEarlierMessages,
}) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm chat-card-container">
            <Card.Header className="bg-white d-flex align-items-center gap-3 py-3 border-bottom">
                <UserAvatar user={targetUser} size={48} className="border profile-theme-border" />
                <Stack>
                    <Card.Title as="h6" className="mb-0 fw-bold">
                        {formatUserName(targetUser)}
                    </Card.Title>
                    {isTyping && (
                        <Stack as="small" className="text-primary fst-italic">
                            {t('isTyping')}...
                        </Stack>
                    )}
                </Stack>
            </Card.Header>

            <Card.Body className="d-flex flex-column gap-3 chat-body-scrollable bg-light">
                {hasMoreMessages && (
                    <Button variant="link" size="sm" onClick={loadEarlierMessages} disabled={loadingEarlier}>
                        {loadingEarlier ? <Spinner animation="border" size="sm" /> : t('loadEarlier')}
                    </Button>
                )}

                {[...messages].reverse().map((msg) => {
                    const isMine = msg.senderUserId === currentUser.id;
                    return (
                        <Stack key={msg.id} className={isMine ? 'align-items-end' : 'align-items-start'}>
                            <Stack
                                className={`p-2 px-3 rounded-4 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white border'}`}
                            >
                                {msg.text}
                            </Stack>
                            <Stack as="small" className="text-muted mt-1 px-1">
                                {formatDate(msg.createdAt)}
                            </Stack>
                        </Stack>
                    );
                })}
                <Stack ref={chatEndRef as any} />
            </Card.Body>

            <Card.Footer className="bg-white p-3 border-top">
                <Form onSubmit={handleSendMessage}>
                    <Stack direction="horizontal" gap={2} className="align-items-start">
                        <InputField
                            groupClassName="flex-grow-1"
                            className="rounded-pill"
                            name="text"
                            error={fieldErrors.text}
                            placeholder={canSendMessages ? t('typeMessage') : t('mustBeFriendsToChat')}
                            aria-label={t('typeMessage')}
                            value={messageInput}
                            onChange={handleTyping as any}
                            disabled={isSending || !canSendMessages}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            className="rounded-circle px-2"
                            disabled={!messageInput.trim() || isSending || !canSendMessages}
                            aria-label={t('send')}
                        >
                            {isSending ? <Spinner animation="border" size="sm" /> : <BootstrapIcon name="send-fill" />}
                        </Button>
                    </Stack>
                </Form>
            </Card.Footer>
        </Card>
    );
};
