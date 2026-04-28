<?php

namespace App\Service;

use App\Dto\{ConversationActivityIndexDto, ConversationDto, ConversationIndexDto, ConversationStatusDto};
use App\Entity\{Conversation, ConversationActivity, User};
use App\Enum\{ConversationStatusEnum, NotificationTypeEnum};
use App\Event\NotificationEvent;
use App\Repository\{ConversationActivityRepository, ConversationRepository, FriendRepository, UserRepository};
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\EventDispatcher\EventDispatcherInterface;

readonly class ConversationService
{
    public function __construct(
        private ConversationRepository $conversationRepository,
        private ConversationActivityRepository $conversationActivityRepository,
        private UserRepository $userRepository,
        private FriendRepository $friendRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    final public function create(Uuid $userId, ConversationDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $receiverUserId = Uuid::fromString($userId);

        $receiver = $this->userRepository->findById($receiverUserId);

        if (! $this->friendRepository->isFriend($user->id, $receiverUserId)) {
            throw new ValidatorException('User is not friend.');
        }

        $conversation = new Conversation(
            $user,
            $receiver,
            $dto->text,
            ConversationStatusEnum::Sent,
        );

        $this->conversationRepository->save($conversation);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $receiver,
                NotificationTypeEnum::Conversation,
                $conversation->text,
                '/users/' . $receiver->link . '/conversations',
            ),
        );

        return $conversation->id;
    }

    final public function update(Uuid $conversationId, ConversationDto $dto): Uuid
    {
        $conversation = $this->conversationRepository->findById($conversationId);

        $conversation->text = $dto->text;
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function updateStatus(Uuid $conversationId, ConversationStatusDto $dto): Uuid
    {
        $conversation = $this->conversationRepository->findById($conversationId);

        $conversation->status = ConversationStatusEnum::from($dto->status);
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function delete(Uuid $conversationId): Uuid
    {
        $conversation = $this->conversationRepository->findById($conversationId);

        $this->conversationRepository->delete($conversation);

        return $conversationId;
    }

    final public function index(ConversationIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->conversationRepository->findConversations($user->id, $dto);
    }

    final public function details(Uuid $conversationId): Conversation
    {
        return $this->conversationRepository->findById($conversationId);
    }

    final public function updateActivityUpdatedAt(Uuid $userReceiverId): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $conversationActivity = $this->conversationActivityRepository->findByUserIds($user->id, $userReceiverId);

        if ($conversationActivity) {
            $conversationActivity->updatedAt = new DateTimeImmutable();
        } else {
            $receiver = $this->userRepository->findById($userReceiverId);

            $conversationActivity = new ConversationActivity($user, $receiver);
        }

        $this->conversationActivityRepository->save($conversationActivity);

        return $conversationActivity->id;
    }

    final public function indexActivity(ConversationActivityIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->conversationActivityRepository->findActivities($user->id, $dto);
    }

    final public function detailsActivity(Uuid $senderUserId): ConversationActivity
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $conversationActivity = $this->conversationActivityRepository->findByUserIds($senderUserId, $user->id);

        if (! $conversationActivity) {
            throw new ValidatorException('Conversation activity not found.');
        }

        return $conversationActivity;
    }
}
