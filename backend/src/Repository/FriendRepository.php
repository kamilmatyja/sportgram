<?php

namespace App\Repository;

use App\Dto\FriendIndexDto;
use App\Entity\Friend;
use App\Enum\FriendStatusEnum;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FriendRepository extends BaseRepository
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

    final public function delete(Friend $friend): void
    {
        $em = $this->getEntityManager();
        $em->remove($friend);
        $em->flush();
    }

    final public function findById(Uuid $friendId): Friend
    {
        /** @var Friend $friend */
        $friend = $this->findOrFail($friendId);

        return $friend;
    }

    final public function findFriends(FriendIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('f');

        if (count($dto->filter->userIds) > 1) {
            $qb->andWhere(
                $qb->expr()->andX(
                    $qb->expr()->in('f.senderUser', ':userIds'),
                    $qb->expr()->in('f.receiverUser', ':userIds'),
                ),
            );
        } else {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->in('f.senderUser', ':userIds'),
                    $qb->expr()->in('f.receiverUser', ':userIds'),
                ),
            );
        }
        $qb->setParameter('userIds', $dto->filter->userIds);

        if ($dto->filter->status) {
            $qb->andWhere('f.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('f.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }

    final public function isFriend(Uuid $userId1, Uuid $userId2): bool
    {
        $qb = $this->createQueryBuilder('f');
        $qb->select('COUNT(f.id)')
            ->where(
                $qb->expr()->orX(
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.senderUser', ':userId1'),
                        $qb->expr()->eq('f.receiverUser', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.senderUser', ':userId2'),
                        $qb->expr()->eq('f.receiverUser', ':userId1'),
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
                        $qb->expr()->eq('f.senderUser', ':userId1'),
                        $qb->expr()->eq('f.receiverUser', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('f.senderUser', ':userId2'),
                        $qb->expr()->eq('f.receiverUser', ':userId1'),
                    ),
                ),
            )
            ->setParameter('userId1', $userId1)
            ->setParameter('userId2', $userId2);

        $count = $qb->getQuery()->getSingleScalarResult();

        return (int)$count > 0;
    }
}
