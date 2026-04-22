<?php

namespace App\Security\Voter;

use App\Entity\User;
use App\Repository\ConversationRepository;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\{Vote, Voter};
use Symfony\Component\Uid\Uuid;

class ConversationVoter extends Voter
{
    public const string CONVERSATION = 'CONVERSATION';

    public function __construct(private readonly ConversationRepository $conversationRepository)
    {
    }

    final protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::CONVERSATION && $subject !== null;
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

        $conversation = $this->conversationRepository->findById($subject);

        if ($conversation->senderUser->id?->toString() === $user->id?->toString()
            || $conversation->receiverUser->id?->toString() === $user->id?->toString()
        ) {
            return true;
        }

        return false;
    }
}
