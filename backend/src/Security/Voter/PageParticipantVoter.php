<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\PageParticipantRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class PageParticipantVoter extends Voter
{
    public const string PAGE_PARTICIPANT = 'PAGE_PARTICIPANT';

    public function __construct(private readonly PageParticipantRepository $pageParticipantRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::PAGE_PARTICIPANT && $subject !== null;
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

        $pageParticipant = $this->pageParticipantRepository->findById($subject);

        if ($pageParticipant && $pageParticipant->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
