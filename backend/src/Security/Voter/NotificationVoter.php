<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\NotificationRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class NotificationVoter extends Voter
{
    public const string NOTIFICATION = 'NOTIFICATION';

    public function __construct(private readonly NotificationRepository $notificationRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::NOTIFICATION && $subject !== null;
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

        $notification = $this->notificationRepository->findById($subject);

        if ($notification && $notification->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
