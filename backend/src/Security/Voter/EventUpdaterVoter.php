<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\EventRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class EventUpdaterVoter extends Voter
{
    public const string EVENT_UPDATER = 'EVENT_UPDATER';

    public function __construct(private readonly EventRepository $eventRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::EVENT_UPDATER && $subject !== null;
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

        $event = $this->eventRepository->findById($subject);

        $pageParticipant = $event->pageParticipant;

        if ($pageParticipant->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
