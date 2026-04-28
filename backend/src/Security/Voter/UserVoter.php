<?php

namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class UserVoter extends Voter
{
    public const string USER = 'USER';

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::USER && $subject !== null;
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

        if (! $subject instanceof Uuid) {
            return false;
        }

        if ($user->id->toString() === $subject->toString()) {
            return true;
        }

        return false;
    }
}
