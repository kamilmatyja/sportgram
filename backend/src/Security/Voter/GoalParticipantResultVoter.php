<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\GoalParticipantResultRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class GoalParticipantResultVoter extends Voter
{
    public const string GOAL_PARTICIPANT_RESULT = 'GOAL_PARTICIPANT_RESULT';

    public function __construct(private readonly GoalParticipantResultRepository $goalParticipantResultRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::GOAL_PARTICIPANT_RESULT && $subject !== null;
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

        $goal = $this->goalParticipantResultRepository->findById($subject);

        if ($goal && $goal->goalParticipant->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
