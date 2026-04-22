<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\FeedCommentRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class FeedCommentCreatorVoter extends Voter
{
    public const string FEED_COMMENT_CREATOR = 'FEED_COMMENT_CREATOR';

    public function __construct(private readonly FeedCommentRepository $feedCommentRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::FEED_COMMENT_CREATOR && $subject !== null;
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

        $feedComment = $this->feedCommentRepository->findById($subject);

        if ($feedComment->user->id?->toString() === $user->id?->toString()) {
            return true;
        }

        return false;
    }
}
