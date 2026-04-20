<?php

namespace App\Service;

use App\Dto\{ConversationCreateDto, ConversationIndexDto, ConversationStatusDto, ConversationUpdateDto};
use App\Entity\{Conversation, ConversationActivity, User};
use App\Enum\ConversationStatusEnum;
use App\Repository\{ConversationActivityRepository, ConversationRepository, UserRepository};
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
        private Security $security,
    ) {
    }

    final public function create(ConversationCreateDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $receiver = $this->userRepository->findById(Uuid::fromString($dto->receiverUserId));

        if (! $receiver) {
            throw new ValidatorException('Receiver user not found.');
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

    final public function update(Uuid $id, ConversationUpdateDto $dto): Uuid
    {
        $conversation = $this->conversationRepository->findById($id);

        if (! $conversation) {
            throw new ValidatorException('Conversation not found.');
        }

        $conversation->text = $dto->text;
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function updateStatus(Uuid $id, ConversationStatusDto $dto): Uuid
    {
        $conversation = $this->conversationRepository->findById($id);

        if (! $conversation) {
            throw new ValidatorException('Conversation not found.');
        }

        $conversation->status = ConversationStatusEnum::from($dto->status);
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function delete(Uuid $id): Uuid
    {
        $conversation = $this->conversationRepository->findById($id);

        if (! $conversation) {
            throw new ValidatorException('Conversation not found.');
        }

        $conversation->softDelete();
        $this->conversationRepository->save($conversation);

        return $conversation->id;
    }

    final public function index(ConversationIndexDto $dto): array
    {
        return $this->conversationRepository->findConversations($dto);
    }

    final public function details(Uuid $id): Conversation
    {
        $conversation = $this->conversationRepository->findById($id);

        if (! $conversation) {
            throw new ValidatorException('Conversation not found.');
        }

        return $conversation;
    }

    final public function updateActivityUpdatedAt(Uuid $userReceiverId): Uuid
    {
        $conversationActivity = $this->activityRepository->findByReceiverUserId($userReceiverId);

        if ($conversationActivity) {
            $conversationActivity->updatedAt = new DateTimeImmutable();
        } else {
            /** @var User $user */
            $user = $this->security->getUser();

            $receiver = $this->userRepository->findById($userReceiverId);

            if (! $receiver) {
                throw new ValidatorException('Receiver user not found.');
            }

            $conversationActivity = new ConversationActivity($user, $receiver);
        }

        $this->activityRepository->save($conversationActivity);

        return $conversationActivity->id;
    }

    final public function detailsActivity(Uuid $userSenderId): ConversationActivity
    {
        $conversationActivity = $this->activityRepository->findBySenderUserId($userSenderId);

        if (! $conversationActivity) {
            throw new ValidatorException('Conversation activity not found.');
        }

        return $conversationActivity;
    }
}
