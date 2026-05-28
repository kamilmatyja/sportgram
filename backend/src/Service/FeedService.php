<?php

namespace App\Service;

use App\Dto\{ElementStatusDto, FeedCommentDto, FeedDto, FeedIndexDto, FeedReactionDto};
use App\Entity\{Feed, FeedComment, FeedReaction, User};
use App\Enum\{ElementStatusEnum, FeedReactionEnum, NotificationTypeEnum};
use App\Event\NotificationEvent;
use App\Repository\{FeedCommentRepository, FeedReactionRepository, FeedRepository, FriendRepository};
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

readonly class FeedService
{
    public function __construct(
        private FeedRepository $feedRepository,
        private FeedCommentRepository $feedCommentRepository,
        private FeedReactionRepository $feedReactionRepository,
        private FriendRepository $friendRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    final public function create(FeedDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $feed = new Feed($user, $dto->text, base64_decode($dto->photo, true), ElementStatusEnum::Active);

        $this->feedRepository->save($feed);

        return $feed->id;
    }

    final public function update(Uuid $feedId, FeedDto $dto): Uuid
    {
        $feed = $this->feedRepository->findById($feedId);

        $feed->text = $dto->text;
        $feed->photo = base64_decode($dto->photo, true);

        $this->feedRepository->save($feed);

        return $feed->id;
    }

    final public function updateStatus(Uuid $feedId, ElementStatusDto $dto): Uuid
    {
        $feed = $this->feedRepository->findById($feedId);

        $feed->status = ElementStatusEnum::from($dto->status);
        $this->feedRepository->save($feed);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $feed->user,
                NotificationTypeEnum::FeedStatus,
                $feed->text,
                '/users/' . $feed->user->link,
            ),
        );

        return $feed->id;
    }

    final public function delete(Uuid $feedId): Uuid
    {
        $feed = $this->feedRepository->findById($feedId);

        $this->feedRepository->delete($feed);

        return $feedId;
    }

    /** @return Feed[] */
    final public function index(FeedIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->feedRepository->findFeeds($user->id, $dto);
    }

    final public function details(Uuid $feedId): Feed
    {
        return $this->feedRepository->findById($feedId);
    }

    final public function createComment(Uuid $feedId, FeedCommentDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $feed = $this->feedRepository->findById($feedId);

        if (! $this->friendRepository->isFriend($user->id, $feed->user->id) && ! $user->id->equals($feed->user->id)) {
            throw new ValidatorException('User is not friend.');
        }

        $feedComment = new FeedComment($feed, $user, $dto->text, ElementStatusEnum::Active);

        $this->feedCommentRepository->save($feedComment);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $feed->user,
                NotificationTypeEnum::FeedComment,
                $dto->text,
                '/users/' . $feed->user->link,
            ),
        );

        return $feedComment->id;
    }

    final public function updateComment(Uuid $feedCommentId, FeedCommentDto $dto): Uuid
    {
        $feedComment = $this->feedCommentRepository->findById($feedCommentId);

        $feedComment->text = $dto->text;

        $this->feedCommentRepository->save($feedComment);

        return $feedComment->id;
    }

    final public function updateCommentStatus(Uuid $feedCommentId, ElementStatusDto $dto): Uuid
    {
        $feedComment = $this->feedCommentRepository->findById($feedCommentId);

        $feedComment->status = ElementStatusEnum::from($dto->status);
        $this->feedCommentRepository->save($feedComment);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $feedComment->user,
                NotificationTypeEnum::FeedCommentStatus,
                $feedComment->text,
                '/users/' . $feedComment->user->link,
            ),
        );

        return $feedComment->id;
    }

    final public function deleteComment(Uuid $feedCommentId): Uuid
    {
        $feedComment = $this->feedCommentRepository->findById($feedCommentId);

        $this->feedCommentRepository->delete($feedComment);

        return $feedCommentId;
    }

    final public function createReaction(Uuid $feedId, FeedReactionDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $feed = $this->feedRepository->findById($feedId);

        if (! $this->friendRepository->isFriend($user->id, $feed->user->id) && ! $user->id->equals($feed->user->id)) {
            throw new ValidatorException('User is not friend.');
        }

        if (! $feed->reactions->filter(fn (FeedReaction $reaction) => $reaction->user->id === $user->id)->isEmpty()) {
            throw new ValidatorException('User already reacted to this feed.');
        }

        $feedReaction = new FeedReaction($feed, $user, FeedReactionEnum::from($dto->type), ElementStatusEnum::Active);

        $this->feedReactionRepository->save($feedReaction);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $feed->user,
                NotificationTypeEnum::FeedReaction,
                $feed->text,
                '/users/' . $feed->user->link,
            ),
        );

        return $feedReaction->id;
    }

    final public function updateReaction(Uuid $feedReactionId, FeedReactionDto $dto): Uuid
    {
        $feedReaction = $this->feedReactionRepository->findById($feedReactionId);

        $feedReaction->reaction = FeedReactionEnum::from($dto->type);

        $this->feedReactionRepository->save($feedReaction);

        return $feedReaction->id;
    }

    final public function updateReactionStatus(Uuid $feedReactionId, ElementStatusDto $dto): Uuid
    {
        $feedReaction = $this->feedReactionRepository->findById($feedReactionId);

        $feedReaction->status = ElementStatusEnum::from($dto->status);
        $this->feedReactionRepository->save($feedReaction);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $feedReaction->user,
                NotificationTypeEnum::FeedReactionStatus,
                $feedReaction->feed->text,
                '/users/' . $feedReaction->user->link,
            ),
        );

        return $feedReaction->id;
    }

    final public function deleteReaction(Uuid $feedReactionId): Uuid
    {
        $feedReaction = $this->feedReactionRepository->findById($feedReactionId);

        $this->feedReactionRepository->delete($feedReaction);

        return $feedReactionId;
    }
}
