import React from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from '../../context/TranslationContext';
import {FeedResponse} from '../../api/responses/FeedResponse';
import {UserResponse} from '../../api/responses/UserResponse';
import BootstrapIcon from '../Common/BootstrapIcon';
import {Stack, Image, Form, Button, Card} from 'react-bootstrap';

interface FeedCommentsProps {
    feed: FeedResponse;
    currentUser: UserResponse | null;
    relatedUsers: Record<string, UserResponse>;
    isFeedLoading: boolean;
    editingCommentId: string | null;
    editCommentText: string;
    commentInputValue: string;
    onCommentInput: (feedId: string, value: string) => void;
    onAddComment: (e: React.SyntheticEvent<HTMLFormElement>, feedId: string) => void;
    onDeleteComment: (feedId: string, commentId: string) => void;
    onStartEditing: (commentId: string, text: string) => void;
    onCancelEditing: () => void;
    onUpdateComment: (feedId: string, commentId: string) => void;
    setEditCommentText: (text: string) => void;
}

export const FeedComments: React.FC<FeedCommentsProps> = ({
                                                              feed,
                                                              currentUser,
                                                              relatedUsers,
                                                              isFeedLoading,
                                                              editingCommentId,
                                                              editCommentText,
                                                              commentInputValue,
                                                              onCommentInput,
                                                              onAddComment,
                                                              onDeleteComment,
                                                              onStartEditing,
                                                              onCancelEditing,
                                                              onUpdateComment,
                                                              setEditCommentText
                                                          }) => {
    const {t} = useTranslation();

    return (
        <Stack className="mt-3">
            {feed.comments?.map(comment => {
                const commentAuthor = relatedUsers[comment.userId];
                const isMyComment = comment.userId === currentUser?.id;
                const isEditing = editingCommentId === comment.id;

                return (
                    <Stack direction="horizontal" gap={2} key={comment.id} className="align-items-start mb-3">
                        {commentAuthor?.profilePhoto ? (
                            <Image
                                src={`data:image/webp;base64,${commentAuthor.profilePhoto}`}
                                alt="avatar"
                                roundedCircle
                                className="object-fit-cover flex-shrink-0 feed-avatar-32"
                            />
                        ) : (
                            <Stack className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32" />
                        )}

                        <Stack className="flex-grow-1">
                            <Stack className="bg-light p-2 rounded-3">
                                <Link
                                    to={`/users/${commentAuthor?.link || comment.userId}`}
                                    className="fw-bold text-decoration-none text-body small d-block"
                                >
                                    {commentAuthor ? `${commentAuthor.firstName} ${commentAuthor.lastName}` : comment.userId}
                                </Link>

                                {isEditing ? (
                                    <Stack className="mt-1">
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            className="mb-1"
                                            value={editCommentText}
                                            onChange={e => setEditCommentText(e.target.value)}
                                        />
                                        <Stack direction="horizontal" gap={1} className="justify-content-end">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={onCancelEditing}
                                                disabled={isFeedLoading}
                                            >
                                                {t('cancel')}
                                            </Button>
                                            <Button
                                                variant="profile-primary"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => onUpdateComment(feed.id, comment.id)}
                                                disabled={isFeedLoading}
                                            >
                                                {t('save')}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Card.Text as="span" className="small text-break mb-0">{comment.text}</Card.Text>
                                )}
                            </Stack>

                            {!isEditing && isMyComment && (
                                <Stack direction="horizontal" gap={2} className="ms-2 mt-1">
                                    <Button
                                        variant="link"
                                        className="p-0 text-muted small text-decoration-none"
                                        onClick={() => onStartEditing(comment.id, comment.text)}
                                        disabled={isFeedLoading}
                                    >
                                        {t('edit')}
                                    </Button>
                                    <Button
                                        variant="link"
                                        className="p-0 text-danger small text-decoration-none"
                                        onClick={() => onDeleteComment(feed.id, comment.id)}
                                        disabled={isFeedLoading}
                                    >
                                        {t('delete')}
                                    </Button>
                                </Stack>
                            )}
                        </Stack>
                    </Stack>
                );
            })}

            <Form onSubmit={(e) => onAddComment(e, feed.id)} className="d-flex gap-2 mt-3">
                {currentUser?.profilePhoto ? (
                    <Image
                        src={`data:image/webp;base64,${currentUser.profilePhoto}`}
                        alt="avatar"
                        roundedCircle
                        className="object-fit-cover flex-shrink-0 feed-avatar-32"
                    />
                ) : (
                    <Stack className="bg-secondary rounded-circle flex-shrink-0 feed-avatar-32" />
                )}
                <Form.Control
                    type="text"
                    size="sm"
                    className="rounded-pill px-3"
                    placeholder={t('writeComment')}
                    value={commentInputValue || ''}
                    onChange={e => onCommentInput(feed.id, e.target.value)}
                    disabled={isFeedLoading}
                />
                <Button
                    type="submit"
                    variant="profile-primary"
                    size="sm"
                    className="rounded-circle px-2 d-flex align-items-center justify-content-center"
                    disabled={isFeedLoading || !(commentInputValue?.trim())}
                >
                    <BootstrapIcon name="send-fill" />
                </Button>
            </Form>
        </Stack>
    );
};