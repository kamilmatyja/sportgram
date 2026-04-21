<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\PageFollowRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class PageFollowVoter extends Voter
{
    public const string PAGE_FOLLOW = 'PAGE_FOLLOW';

    public function __construct(private readonly PageFollowRepository $pageFollowRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::PAGE_FOLLOW && $subject !== null;
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

        $pageFollow = $this->pageFollowRepository->findById($subject);

        if ($pageFollow && $pageFollow->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
