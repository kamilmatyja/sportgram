<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\ConversationActivityRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class ConversationActivityVoter extends Voter
{
    public const string CONVERSATION_ACTIVITY = 'CONVERSATION_ACTIVITY';

    public function __construct(private readonly ConversationActivityRepository $conversationActivityRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::CONVERSATION_ACTIVITY && $subject !== null;
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

        $conversationActivity = $this->conversationActivityRepository->findByUserIds($subject, $user->id);

        if ($conversationActivity) {
            return true;
        }

        return false;
    }
}
