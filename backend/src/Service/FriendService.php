<?php

namespace App\Service;

use App\Dto\{FriendDto, FriendIndexDto, FriendStatusDto};
use App\Entity\{Friend, User};
use App\Enum\FriendStatusEnum;
use App\Repository\{FriendRepository, UserRepository};
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class FriendService
{
    public function __construct(
        private FriendRepository $friendRepository,
        private UserRepository $userRepository,
        private Security $security,
    ) {
    }

    final public function create(FriendDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $receiverUserId = Uuid::fromString($dto->receiverUserId);

        $receiver = $this->userRepository->findById($receiverUserId);

        if (! $receiver) {
            throw new ValidatorException('Receiver user not found.');
        }

        if ($this->friendRepository->hasRow($user->id, $receiverUserId)) {
            throw new ValidatorException('User has friend relationship with this user.');
        }

        $friend = new Friend(
            $user,
            $receiver,
            FriendStatusEnum::Pending,
        );

        $this->friendRepository->save($friend);

        return $friend->id;
    }

    final public function updateStatus(Uuid $friendId, FriendStatusDto $dto): Uuid
    {
        $friend = $this->friendRepository->findById($friendId);

        if (! $friend) {
            throw new ValidatorException('Friend not found.');
        }

        $friend->status = FriendStatusEnum::from($dto->status);
        $this->friendRepository->save($friend);

        return $friend->id;
    }

    final public function delete(Uuid $friendId): Uuid
    {
        $friend = $this->friendRepository->findById($friendId);

        if (! $friend) {
            throw new ValidatorException('Friend not found.');
        }

        $friend->softDelete();
        $this->friendRepository->save($friend);

        return $friend->id;
    }

    final public function index(FriendIndexDto $dto): array
    {
        return $this->friendRepository->findFriends($dto);
    }

    final public function details(Uuid $friendId): Friend
    {
        $friend = $this->friendRepository->findById($friendId);

        if (! $friend) {
            throw new ValidatorException('Friend not found.');
        }

        return $friend;
    }
}
