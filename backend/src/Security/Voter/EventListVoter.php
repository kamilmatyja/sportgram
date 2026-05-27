<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Enum\RoleEnum;
use App\Repository\EventDisciplineListRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class EventListVoter extends Voter
{
    public const string EVENT_LIST = 'EVENT_LIST';

    public function __construct(private readonly EventDisciplineListRepository $eventDisciplineListRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EVENT_LIST && $subject !== null;
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

        $eventDisciplineList = $this->eventDisciplineListRepository->findById($subject);

        $pageParticipant = $eventDisciplineList->eventDisciplineDistance->eventDiscipline->event->pageParticipant;

        if ($pageParticipant->user->id->toString() === $user->id->toString()
            || $eventDisciplineList->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
