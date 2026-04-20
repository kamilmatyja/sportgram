<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Enum\RoleEnum;
use App\Repository\FriendRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class FriendVoter extends Voter
{
    public const string FRIEND = 'FRIEND';

    public function __construct(private readonly FriendRepository $friendRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::FRIEND && $subject !== null;
    }

    final protected function voteOnAttribute(
        string $attribute,
        mixed $subject,
        TokenInterface $token,
        ?Vote $vote = null,
    ): bool {
        $user = $token->getUser();

        if (! $user instanceof User) {
            return false;
        }

        if (in_array(RoleEnum::ROLE_ADMINISTRATOR, $user->getRoles(), true)) {
            return true;
        }

        if (! $subject instanceof Uuid) {
            return false;
        }

        $friend = $this->friendRepository->findById($subject);

        if ($friend && (
            $friend->senderUser->id?->toString() === $user->id?->toString() ||
                $friend->receiverUser->id?->toString() === $user->id?->toString()
        )) {
            return true;
        }

        return false;
    }
}
