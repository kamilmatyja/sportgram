<?php

namespace App\Repository;

use App\Entity\FeedComment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class FeedCommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FeedComment::class);
    }

    final public function save(FeedComment $feedComment): void
    {
        $em = $this->getEntityManager();
        $em->persist($feedComment);
        $em->flush();
    }
}
