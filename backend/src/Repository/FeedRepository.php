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

    final public function findFeeds(Uuid $userId, FeedIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('f');

        if ($dto->filter->userId) {
            $qb->andWhere('f.user = :user_id')
                ->setParameter('user_id', $dto->filter->userId);
        } else {
            $qb->leftJoin(
                'friends',
                'fr',
                '(
                    (fr.sender_user = f.user_id AND fr.receiver_user = :userId)
                    OR (fr.sender_user = :userId AND fr.receiver_user = f.user_id)
                )',
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
        $dbField = $this->camelCaseToSnakeCase($field);
        $qb->orderBy('f.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
