<?php

namespace App\Repository;

use App\Entity\FeedReaction;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class FeedReactionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FeedReaction::class);
    }

    final public function save(FeedReaction $feedReaction): void
    {
        $em = $this->getEntityManager();
        $em->persist($feedReaction);
        $em->flush();
    }
}
