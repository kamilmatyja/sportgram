import React from 'react';
import { useTranslation } from '../../context/TranslationContext';
import { UserResponse } from '../../api/responses/UserResponse';
import { ConversationResponse } from '../../api/responses/ConversationResponse';
import { formatDate } from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import { Card, Form, Button, Image, Spinner } from 'react-bootstrap';

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
        <Card className="shadow-sm" style={{ height: '70vh' }}>
            <Card.Header className="d-flex align-items-center gap-3">
                {targetUser.profilePhoto ? (
                    <Image src={`data:image/webp;base64,${targetUser.profilePhoto}`}
                           roundedCircle style={{ width: 40, height: 40, objectFit: 'cover' }} />
                ) : (
                    <div className="bg-secondary rounded-circle" style={{ width: 40, height: 40 }} />
                )}
                <div>
                    <h6 className="mb-0 fw-bold">{targetUser.firstName} {targetUser.lastName}</h6>
                    {isTyping && <small className="text-primary fst-italic">{t('isTyping')}...</small>}
                </div>
            </Card.Header>

            <Card.Body className="d-flex flex-column gap-2" style={{ overflowY: 'auto', backgroundColor: '#f8f9fa' }}>
                {hasMoreMessages && (
                    <div className="text-center mb-3">
                        <Button size="sm" variant="link" onClick={loadEarlierMessages} disabled={loadingEarlier}>
                            {loadingEarlier ? <Spinner animation="border" size="sm" /> : t('loadEarlier')}
                        </Button>
                    </div>
                )}

                {[...messages].reverse().map(msg => {
                    const isMine = msg.senderUserId === currentUser.id;
                    return (
                        <div key={msg.id} className={`d-flex flex-column ${isMine ? 'align-items-end' : 'align-items-start'}`}>
                            <div className={`p-2 px-3 rounded-3 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-white border'}`}>
                                {msg.text}
                            </div>
                            <small className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>{formatDate(msg.createdAt)}</small>
                        </div>
                    );
                })}
                <div ref={chatEndRef as any} />
            </Card.Body>

            <Card.Footer className="bg-white border-top-0 p-3">
                <Form onSubmit={handleSendMessage} className="d-flex gap-2">
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
                </Form>
            </Card.Footer>
        </Card>
    );
};