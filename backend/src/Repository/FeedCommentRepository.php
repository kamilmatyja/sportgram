<?php

namespace App\Repository;

use App\Entity\FeedComment;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FeedCommentRepository extends BaseRepository
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

    final public function delete(FeedComment $feedComment): void
    {
        $em = $this->getEntityManager();
        $em->remove($feedComment);
        $em->flush();
    }

    final public function findById(Uuid $feedCommentId): FeedComment
    {
        /** @var FeedComment $feedComment */
        $feedComment = $this->findOrFail($feedCommentId);

        return $feedComment;
    }
}
