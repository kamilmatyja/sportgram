import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { Card, Stack, Form, Button, Image, Spinner } from 'react-bootstrap';

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
                                                          targetUser, currentUser, messages, messageInput, isSending, isTyping,
                                                          hasMoreMessages, loadingEarlier, canSendMessages, chatEndRef,
                                                          handleTyping, handleSendMessage, loadEarlierMessages
                                                      }) => {
    const { t } = useTranslation();

    return (
        <Card className="shadow-sm" style={{ height: '75vh' }}>
            <Card.Header className="d-flex align-items-center gap-3 py-3">
                {targetUser.profilePhoto ? (
                    <Image src={`data:image/webp;base64,${targetUser.profilePhoto}`}
                           roundedCircle style={{ width: 45, height: 45, objectFit: 'cover' }} />
                ) : (
                    <div className="bg-secondary rounded-circle" style={{ width: 45, height: 45 }} />
                )}
                <Stack>
                    <h6 className="mb-0 fw-bold">{targetUser.firstName} {targetUser.lastName}</h6>
                    {isTyping && <small className="text-primary fst-italic">{t('isTyping')}...</small>}
                </Stack>
            </Card.Header>

            <Card.Body className="d-flex flex-column gap-3" style={{ overflowY: 'auto', backgroundColor: '#f0f2f5' }}>
                {hasMoreMessages && (
                    <Button variant="link" size="sm" onClick={loadEarlierMessages} disabled={loadingEarlier}>
                        {loadingEarlier ? <Spinner animation="border" size="sm" /> : t('loadEarlier')}
                    </Button>
                )}

                {[...messages].reverse().map(msg => {
                    const isMine = msg.senderUserId === currentUser.id;
                    return (
                        <Stack key={msg.id} className={isMine ? 'align-items-end' : 'align-items-start'}>
                            <div className={`p-2 px-3 rounded-4 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white border'}`}
                                 style={{ maxWidth: '80%' }}>
                                {msg.text}
                            </div>
                            <small className="text-muted mt-1 px-1" style={{ fontSize: '0.7rem' }}>
                                {formatDate(msg.createdAt)}
                            </small>
                        </Stack>
                    );
                })}
                <div ref={chatEndRef as any} />
            </Card.Body>

            <Card.Footer className="bg-white p-3 border-top-0">
                <Form onSubmit={handleSendMessage}>
                    <Stack direction="horizontal" gap={2}>
                        <Form.Control
                            className="rounded-pill"
                            placeholder={canSendMessages ? t('typeMessage') : t('mustBeFriendsToChat')}
                            value={messageInput}
                            onChange={handleTyping as any}
                            disabled={isSending || !canSendMessages}
                        />
                        <Button type="submit" variant="primary" className="rounded-circle"
                                disabled={!messageInput.trim() || isSending || !canSendMessages}>
                            {isSending ? <Spinner animation="border" size="sm" /> : <BootstrapIcon name="send-fill" />}
                        </Button>
                    </Stack>
                </Form>
            </Card.Footer>
        </Card>
    );
};