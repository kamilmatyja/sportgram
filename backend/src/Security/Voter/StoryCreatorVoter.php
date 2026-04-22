<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\StoryRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class StoryCreatorVoter extends Voter
{
    public const string STORY_CREATOR = 'STORY_CREATOR';

    public function __construct(private readonly StoryRepository $storyRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::STORY_CREATOR && $subject !== null;
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

        $story = $this->storyRepository->findById($subject);

        if ($story->user->id->toString() === $user->id->toString()) {
            return true;
        }

        return false;
    }
}
