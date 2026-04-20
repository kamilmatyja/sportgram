<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Enum\RoleEnum;
use App\Repository\PushSubscriptionRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class PushSubscriptionVoter extends Voter
{
    public const string PUSH_SUBSCRIPTION = 'PUSH_SUBSCRIPTION';

    public function __construct(private readonly PushSubscriptionRepository $pushSubscriptionRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::PUSH_SUBSCRIPTION && $subject !== null;
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

        $pushSubscription = $this->pushSubscriptionRepository->findById($subject);

        if ($pushSubscription && $pushSubscription->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
