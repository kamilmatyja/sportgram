<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Enum\RoleEnum;
use App\Repository\FeedReactionRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class FeedReactionVoter extends Voter
{
    public const string FEED_REACTION = 'FEED_REACTION';

    public function __construct(private readonly FeedReactionRepository $feedReactionRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::FEED_REACTION && $subject !== null;
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

        $feedReaction = $this->feedReactionRepository->findById($subject);

        if ($feedReaction && $feedReaction->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
