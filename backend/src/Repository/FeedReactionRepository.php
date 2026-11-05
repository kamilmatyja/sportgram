<?php

namespace App\Repository;

use App\Dto\FeedReactionIndexDto;
use App\Entity\FeedReaction;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
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
        /** @var FeedReaction $feedReaction */
        $feedReaction = $this->findOrFail($feedReactionId);

        return $feedReaction;
    }

    final public function findReactions(FeedReactionIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('r');

        if ($dto->filter->userId) {
            $qb->andWhere('r.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->feedId) {
            $qb->andWhere('r.feed = :feedId')
                ->setParameter('feedId', $dto->filter->feedId);
        }

        if ($dto->filter->reaction) {
            $qb->andWhere('r.reaction = :reaction')
                ->setParameter('reaction', $dto->filter->reaction);
        }

        if ($dto->filter->status) {
            $qb->andWhere('r.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        $this->order($dto->sort, $qb, 'r');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
