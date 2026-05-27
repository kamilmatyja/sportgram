<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\TrainingRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class TrainingCreatorVoter extends Voter
{
    public const string TRAINING_CREATOR = 'TRAINING_CREATOR';

    public function __construct(private readonly TrainingRepository $trainingRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::TRAINING_CREATOR && $subject !== null;
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

        $training = $this->trainingRepository->findById($subject);

        if ($training->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
