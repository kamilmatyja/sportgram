<?php

namespace App\Service;

use App\Dto\{ConversationDto, ConversationIndexDto, ConversationStatusDto};
use App\Entity\{Conversation, ConversationActivity, User};
use App\Enum\ConversationStatusEnum;
use App\Repository\{ConversationActivityRepository, ConversationRepository, FriendRepository, UserRepository};
use DateTimeImmutable;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class ConversationService
{
    public function __construct(
        private ConversationRepository $conversationRepository,
        private ConversationActivityRepository $activityRepository,
        private UserRepository $userRepository,
        private FriendRepository $friendRepository,
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

        $conversation->softDelete();
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function index(ConversationIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->conversationRepository->findConversations($user->id, $dto);
    }

    final public function details(Uuid $conversationId): Conversation
    {
        $conversation = $this->conversationRepository->findById($conversationId);

        return $conversation;
    }

    final public function updateActivityUpdatedAt(Uuid $userReceiverId): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $conversationActivity = $this->activityRepository->findByUserIds($user->id, $userReceiverId);

        if ($conversationActivity) {
            $conversationActivity->updatedAt = new DateTimeImmutable();
        } else {
            $receiver = $this->userRepository->findById($userReceiverId);

            $conversationActivity = new ConversationActivity($user, $receiver);
        }

        $this->activityRepository->save($conversationActivity);

        return $conversationActivity->id;
    }

    final public function detailsActivity(Uuid $senderUserId): ConversationActivity
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $conversationActivity = $this->activityRepository->findByUserIds($senderUserId, $user->id);

        if (! $conversationActivity) {
            throw new ValidatorException('Conversation activity not found.');
        }

        return $conversationActivity;
    }
}
