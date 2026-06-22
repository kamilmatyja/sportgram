import React from 'react';
import {useTranslation} from '../../context/TranslationContext';
import {UserResponse} from '../../api/responses/UserResponse';
import {ConversationResponse} from '../../api/responses/ConversationResponse';
import {formatDate} from '../../utils/dateFormat';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Card, Stack, Form, Button, Image, Spinner} from 'react-bootstrap';

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
        <Card className="shadow-sm d-flex flex-column chat-card-container">
            <Card.Header className="bg-light d-flex align-items-center gap-3">
                {targetUser.profilePhoto ? (
                    <Image src={`data:image/webp;base64,${targetUser.profilePhoto}`} alt="avatar"
                           roundedCircle className="object-fit-cover feed-avatar-32" />
                ) : (
                    <Stack className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32" />
                )}
                <Stack>
                    <Card.Title as="h6" className="mb-0 fw-bold">{targetUser.firstName} {targetUser.lastName}</Card.Title>
                    <Stack>
                        {isTyping && <Card.Text as="small" className="text-profile-primary fst-italic mb-0">{t('isTyping')}...</Card.Text>}
                    </Stack>
                </Stack>
            </Card.Header>

            <Card.Body className="chat-body-scrollable d-flex flex-column gap-2 bg-light bg-opacity-50">
                {hasMoreMessages && (
                    <Stack className="text-center mb-3 align-items-center">
                        <Button size="sm" variant="outline-secondary" onClick={loadEarlierMessages} disabled={loadingEarlier}>
                            {loadingEarlier ? <Spinner animation="border" size="sm" /> : t('loadEarlier')}
                        </Button>
                    </Stack>
                )}

                {[...messages].reverse().map(msg => {
                    const isMine = msg.senderUserId === currentUser.id;
                    return (
                        <Stack key={msg.id} className={isMine ? 'align-items-end' : 'align-items-start'}>
                            <Stack className={`p-2 px-3 rounded-3 text-break shadow-sm ${isMine ? 'profile-theme-bg' : 'bg-white border'}`}>
                                {msg.text}
                            </Stack>
                            <Card.Text as="small" className="text-muted mt-1">{formatDate(msg.createdAt)}</Card.Text>
                        </Stack>
                    );
                })}
                <Stack ref={chatEndRef as any} />
            </Card.Body>

            <Card.Footer className="bg-white border-top-0 pt-3 pb-3">
                <Form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        className="rounded-pill px-4"
                        placeholder={canSendMessages ? t('typeMessage') : t('mustBeFriendsToChat')}
                        value={messageInput}
                        onChange={handleTyping as any}
                        disabled={isSending || !canSendMessages}
                    />
                    <Button type="submit"
                            variant="profile-primary"
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            disabled={!messageInput.trim() || isSending || !canSendMessages}>
                        {isSending ? <Spinner animation="border" size="sm" /> : <BootstrapIcon name="send-fill" />}
                    </Button>
                </Form>
            </Card.Footer>
        </Card>
    );
};