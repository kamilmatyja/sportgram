import React from 'react';
import { Stack, Image, Form, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

import { FeedResponse } from '../../api/responses/FeedResponse';
import { UserResponse } from '../../api/responses/UserResponse';
import { useTranslation } from '../../context/TranslationContext';
import BootstrapIcon from '../Common/BootstrapIcon';

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
    setEditCommentText,
}) => {
    const { t } = useTranslation();

    return (
        <Stack gap={3} className="mt-3">
            {feed.comments?.map((comment) => {
                const commentAuthor = comment.user ?? relatedUsers?.[comment.userId];
                const isMyComment = comment.userId === currentUser?.id;
                const isEditing = editingCommentId === comment.id;

                return (
                    <Stack direction="horizontal" gap={2} key={comment.id} className="align-items-start">
                        {commentAuthor?.profilePhoto ? (
                            <Image
                                src={`data:image/webp;base64,${commentAuthor.profilePhoto}`}
                                roundedCircle
                                className="object-fit-cover feed-avatar-32"
                            />
                        ) : (
                            <Stack className="bg-secondary rounded-circle feed-avatar-32" />
                        )}

                        <Stack className="flex-grow-1">
                            <Stack className="bg-light p-2 rounded-3">
                                <Link
                                    to={`/users/${commentAuthor?.link || comment.userId}`}
                                    className="text-decoration-none text-body small"
                                >
                                    {commentAuthor ? `${commentAuthor.firstName} ${commentAuthor.lastName}` : '-'}
                                </Link>

                                {isEditing ? (
                                    <Stack gap={1} className="mt-1">
                                        <Form.Control
                                            type="text"
                                            size="sm"
                                            value={editCommentText}
                                            onChange={(e) => setEditCommentText(e.target.value)}
                                        />
                                        <Stack direction="horizontal" gap={1} className="justify-content-end">
                                            <Button
                                                variant="outline-secondary"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={onCancelEditing}
                                            >
                                                {t('cancel')}
                                            </Button>
                                            <Button
                                                variant="profile-primary"
                                                size="sm"
                                                className="py-0 px-2"
                                                onClick={() => onUpdateComment(feed.id, comment.id)}
                                            >
                                                {t('save')}
                                            </Button>
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Stack as="span" className="small text-break">
                                        {comment.text}
                                    </Stack>
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

            <Form onSubmit={(e) => onAddComment(e, feed.id)}>
                <Stack direction="horizontal" gap={2}>
                    {currentUser?.profilePhoto ? (
                        <Image
                            src={`data:image/webp;base64,${currentUser.profilePhoto}`}
                            roundedCircle
                            className="object-fit-cover feed-avatar-32"
                        />
                    ) : (
                        <Stack className="bg-secondary rounded-circle feed-avatar-32" />
                    )}
                    <Form.Control
                        type="text"
                        size="sm"
                        className="rounded-pill"
                        placeholder={t('writeComment')}
                        value={commentInputValue || ''}
                        onChange={(e) => onCommentInput(feed.id, e.target.value)}
                        disabled={isFeedLoading}
                    />
                    <Button
                        type="submit"
                        variant="profile-primary"
                        size="sm"
                        className="rounded-circle px-2"
                        disabled={isFeedLoading || !commentInputValue?.trim()}
                    >
                        <BootstrapIcon name="send-fill" />
                    </Button>
                </Stack>
            </Form>
        </Stack>
    );
};
