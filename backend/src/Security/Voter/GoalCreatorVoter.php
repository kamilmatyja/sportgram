<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\GoalRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class GoalCreatorVoter extends Voter
{
    public const string GOAL_CREATOR = 'GOAL_CREATOR';

    public function __construct(private readonly GoalRepository $goalRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::GOAL_CREATOR && $subject !== null;
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

        $goal = $this->goalRepository->findById($subject);

        if ($goal && $goal->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
