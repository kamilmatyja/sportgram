<?php

namespace App\Repository;

use App\Dto\FeedIndexDto;
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

    final public function findById(Uuid $feedId): ?Feed
    {
        /** @var ?Feed $feed */
        $feed = $this->find($feedId);

        return $feed;
    }

    final public function findWithCommentsAndReactions(Uuid $feedId): ?Feed
    {
        return $this->createQueryBuilder('f')
            ->leftJoin('f.reactions', 'r')
            ->leftJoin('f.comments', 'c')
            ->addSelect('r')
            ->addSelect('c')
            ->where('f.id = :id')
            ->setParameter('id', $feedId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    final public function findWithComments(Uuid $feedId): ?Feed
    {
        return $this->createQueryBuilder('f')
            ->leftJoin('f.comments', 'c')
            ->addSelect('c')
            ->where('f.id = :id')
            ->setParameter('id', $feedId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    final public function findWithReactions(Uuid $feedId): ?Feed
    {
        return $this->createQueryBuilder('f')
            ->leftJoin('f.reactions', 'r')
            ->addSelect('r')
            ->where('f.id = :id')
            ->setParameter('id', $feedId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    final public function findFeeds(FeedIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('f');

        if ($dto->filter->userId) {
            $qb->andWhere('f.user_id = :user_id')
                ->setParameter('user_id', $dto->filter->userId);
        }

        if ($dto->filter->text) {
            $qb->andWhere('f.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('f.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('s.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        // TODO - zawęzić o listę znajomych

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
