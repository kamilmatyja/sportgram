<?php

namespace App\Service;

use App\Dto\{FriendDto, FriendIndexDto, FriendStatusDto};
use App\Entity\{Friend, User};
use App\Enum\{FriendStatusEnum, NotificationTypeEnum};
use App\Event\NotificationEvent;
use App\Repository\{FriendRepository, UserRepository};
use Doctrine\ORM\Tools\Pagination\WindowPage;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class FriendService
{
    public function __construct(
        private FriendRepository $friendRepository,
        private UserRepository $userRepository,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    final public function create(FriendDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $receiver = $this->userRepository->findById($dto->receiverUserId);

        if ($this->friendRepository->hasRow($user->id, $dto->receiverUserId)) {
            throw new ValidatorException('User already has friend relationship with this user.');
        }

        $friend = new Friend(
            $user,
            $receiver,
            FriendStatusEnum::Pending,
        );

        $this->friendRepository->save($friend);

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $receiver,
                NotificationTypeEnum::Friend,
                $user->firstName . ' ' . $user->lastName,
                '/users/' . $user->link,
            ),
        );

        return $friend->id;
    }

    final public function updateStatus(Uuid $friendId, FriendStatusDto $dto): Uuid
    {
        $friend = $this->friendRepository->findById($friendId);

        $friend->status = $dto->status;
        $this->friendRepository->save($friend);

        $sender = $friend->senderUser;
        $receiver = $friend->receiverUser;

        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $sender,
                NotificationTypeEnum::FriendStatus,
                $receiver->firstName . ' ' . $receiver->lastName,
                '/users/' . $receiver->link,
            ),
        );
        $this->eventDispatcher->dispatch(
            new NotificationEvent(
                $receiver,
                NotificationTypeEnum::FriendStatus,
                $sender->firstName . ' ' . $sender->lastName,
                '/users/' . $sender->link,
            ),
        );

        return $friend->id;
    }

    final public function delete(Uuid $friendId): Uuid
    {
        $friend = $this->friendRepository->findById($friendId);

        $this->friendRepository->delete($friend);

        return $friendId;
    }

    final public function index(FriendIndexDto $dto): WindowPage
    {
        return $this->friendRepository->findFriends($dto);
    }

    final public function details(Uuid $friendId): Friend
    {
        return $this->friendRepository->findById($friendId);
    }
}
