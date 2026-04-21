<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\GoalParticipantRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class GoalParticipantVoter extends Voter
{
    public const string GOAL_PARTICIPANT = 'GOAL_PARTICIPANT';

    public function __construct(private readonly GoalParticipantRepository $goalParticipantRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::GOAL_PARTICIPANT && $subject !== null;
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

        $goal = $this->goalParticipantRepository->findById($subject);

        if ($goal && $goal->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
