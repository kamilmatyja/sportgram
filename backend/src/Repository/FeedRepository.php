<?php

namespace App\Repository;

use App\Dto\FeedIndexDto;
use App\Entity\Feed;
use App\Enum\FriendStatusEnum;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FeedRepository extends BaseRepository
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

    final public function delete(Feed $feed): void
    {
        $em = $this->getEntityManager();
        $em->remove($feed);
        $em->flush();
    }

    final public function findById(Uuid $feedId): Feed
    {
        /** @var Feed $feed */
        $feed = $this->findOrFail($feedId);

        return $feed;
    }

    /** @return Feed[] */
    final public function findFeeds(Uuid $userId, FeedIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('f');

        if ($dto->filter->userId) {
            $qb->andWhere('f.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        } else {
            $qb->leftJoin(
                'App\\Entity\\Friend',
                'fr',
                'WITH',
                '((fr.senderUser = f.user AND fr.receiverUser = :userId) OR (fr.senderUser = :userId AND fr.receiverUser = f.user))',
            );
            $qb->andWhere('(f.user = :userId OR (fr.id IS NOT NULL AND fr.status = :acceptedStatus))')
                ->setParameter('userId', $userId)
                ->setParameter('acceptedStatus', FriendStatusEnum::Accepted->value);
        }

        if ($dto->filter->text) {
            $qb->andWhere('f.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('f.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('f.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
