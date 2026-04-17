<?php

namespace App\Security\Voter;

use App\Dto\UserUpdateDto;
use App\Entity\User;
use App\Enum\RoleEnum;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};

class UserRoleVoter extends Voter
{
    public const string ASSIGN_ADMIN_ROLE = 'ASSIGN_ADMIN_ROLE';

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::ASSIGN_ADMIN_ROLE && $subject instanceof UserUpdateDto;
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

        if (in_array(RoleEnum::ROLE_ADMINISTRATOR, $subject->roles, true)) {
            return in_array(RoleEnum::ROLE_ADMINISTRATOR, $user->getRoles(), true);
        }

        return true;
    }
}
