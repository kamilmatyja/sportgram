<?php

namespace App\Repository;

use App\Entity\ConversationActivity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

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
}
