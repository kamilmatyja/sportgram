<?php

namespace App\Repository;

use App\Entity\ConversationActivity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class ConversationActivityRepository extends ServiceEntityRepository
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

    final public function findBySenderUserId(Uuid $userId): ?ConversationActivity
    {
        /** @var ?ConversationActivity $conversationActivity */
        $conversationActivity = $this->findOneBy(['sender_user_id' => $userId], ['created_at' => 'DESC']);

        return $conversationActivity;
    }

    final public function findByReceiverUserId(Uuid $userId): ?ConversationActivity
    {
        /** @var ?ConversationActivity $conversationActivity */
        $conversationActivity = $this->findOneBy(['receiver_user_id' => $userId], ['created_at' => 'DESC']);

        return $conversationActivity;
    }
}
