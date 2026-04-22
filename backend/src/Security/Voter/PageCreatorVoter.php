<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\PageRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class PageCreatorVoter extends Voter
{
    public const string PAGE_CREATOR = 'PAGE_CREATOR';

    public function __construct(private readonly PageRepository $pageRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::PAGE_CREATOR && $subject !== null;
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

        $page = $this->pageRepository->findById($subject);

        if ($page->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
