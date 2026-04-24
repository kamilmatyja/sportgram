<?php

namespace App\Repository;

use App\Entity\FeedReaction;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FeedReactionRepository extends BaseRepository
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

    final public function delete(FeedReaction $feedReaction): void
    {
        $em = $this->getEntityManager();
        $em->remove($feedReaction);
        $em->flush();
    }

    final public function findById(Uuid $feedReactionId): FeedReaction
    {
        /** @var ?FeedReaction $feedReaction */
        $feedReaction = $this->findOrFail($feedReactionId);

        return $feedReaction;
    }
}
