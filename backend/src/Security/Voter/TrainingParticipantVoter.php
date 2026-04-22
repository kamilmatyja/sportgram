<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\TrainingParticipantRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class TrainingParticipantVoter extends Voter
{
    public const string TRAINING_PARTICIPANT = 'TRAINING_PARTICIPANT';

    public function __construct(private readonly TrainingParticipantRepository $trainingParticipantRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::TRAINING_PARTICIPANT && $subject !== null;
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

        $trainingParticipant = $this->trainingParticipantRepository->findById($subject);

        if ($trainingParticipant->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
