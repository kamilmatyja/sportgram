<?php

namespace App\Repository;

use App\Entity\Feed;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FeedRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Feed::class);
    }

    final public function save(Feed $feed): void
    {
        $em = $this->getEntityManager();
        $em->persist($feed);
        $em->flush();
    }

    final public function findById(Uuid $id): ?Feed
    {
        /** @var ?Feed $feed */
        $feed = $this->find($id);

        return $feed;
    }
}
