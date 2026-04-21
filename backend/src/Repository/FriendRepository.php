<?php

namespace App\Repository;

use App\Dto\FriendIndexDto;
use App\Entity\Friend;
use App\Enum\FriendStatusEnum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FriendRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Friend::class);
    }

    final public function save(Friend $friend): void
    {
        $em = $this->getEntityManager();
        $em->persist($friend);
        $em->flush();
    }

    final public function findById(Uuid $friendId): ?Friend
    {
        /** @var ?Friend $friend */
        $friend = $this->find($friendId);

        return $friend;
    }

    final public function findFriends(FriendIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('f');

        if ($dto->filter->userId) {
            $qb->andWhere($qb->expr()->orX(
                $qb->expr()->eq('f.sender_user_id', ':userId'),
                $qb->expr()->eq('f.receiver_user_id', ':userId'),
            ))
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->status) {
            $qb->andWhere('f.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('f.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    final public function isFriend(Uuid $userId1, Uuid $userId2): bool
    {
        $qb = $this->createQueryBuilder('f');
        $qb->select('COUNT(f.id)')
            ->where(
                $qb->expr()->orX(
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.sender_user_id', ':userId1'),
                        $qb->expr()->eq('f.receiver_user_id', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.sender_user_id', ':userId2'),
                        $qb->expr()->eq('f.receiver_user_id', ':userId1'),
                    ),
                ),
            )
            ->andWhere('f.status = :status')
            ->setParameter('userId1', $userId1)
            ->setParameter('userId2', $userId2)
            ->setParameter('status', FriendStatusEnum::Accepted->value);

        $count = $qb->getQuery()->getSingleScalarResult();

        return (int)$count > 0;
    }

    final public function hasRow(Uuid $userId1, Uuid $userId2): bool
    {
        $qb = $this->createQueryBuilder('f');
        $qb->select('COUNT(f.id)')
            ->where(
                $qb->expr()->orX(
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.sender_user_id', ':userId1'),
                        $qb->expr()->eq('f.receiver_user_id', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.sender_user_id', ':userId2'),
                        $qb->expr()->eq('f.receiver_user_id', ':userId1'),
                    ),
                ),
            )
            ->setParameter('userId1', $userId1)
            ->setParameter('userId2', $userId2);

        $count = $qb->getQuery()->getSingleScalarResult();

        return (int)$count > 0;
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
