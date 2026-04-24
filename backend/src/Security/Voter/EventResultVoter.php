<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\EventDisciplineResultRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class EventResultVoter extends Voter
{
    public const string EVENT_RESULT = 'EVENT_RESULT';

    public function __construct(private readonly EventDisciplineResultRepository $eventDisciplineResultRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EVENT_RESULT && $subject !== null;
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

        $eventDisciplineResult = $this->eventDisciplineResultRepository->findById($subject);

        $pageParticipant = $eventDisciplineResult->eventDisciplineList->eventDisciplineDistance->eventDiscipline->event->pageParticipant;

        if ($pageParticipant->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
