<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\EventDisciplineListRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class EventListCreatorVoter extends Voter
{
    public const string EVENT_LIST_CREATOR = 'EVENT_LIST_CREATOR';

    public function __construct(private readonly EventDisciplineListRepository $eventDisciplineListRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EVENT_LIST_CREATOR && $subject !== null;
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

        $eventDisciplineList = $this->eventDisciplineListRepository->findById($subject);

        $pageParticipant = $eventDisciplineList->eventDisciplineDistance->eventDiscipline->event->pageParticipant;

        if ($pageParticipant->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
