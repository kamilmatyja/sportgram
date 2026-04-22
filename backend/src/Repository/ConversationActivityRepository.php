<?php

namespace App\Repository;

use App\Entity\ConversationActivity;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class ConversationActivityRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConversationActivity::class);
    }

    final public function save(ConversationActivity $conversationActivity): void
    {
        $em = $this->getEntityManager();
        $em->persist($conversationActivity);
        $em->flush();
    }

    final public function findByUserIds(Uuid $senderUserId, Uuid $receiverUserId): ?ConversationActivity
    {
        /** @var ?ConversationActivity $conversationActivity */
        $conversationActivity = $this->findOneBy(
            ['sender_user_id' => $senderUserId, 'receiver_user_id' => $receiverUserId],
            ['created_at' => 'DESC'],
        );

        return $conversationActivity;
    }
}
