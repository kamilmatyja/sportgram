<?php

namespace App\Repository;

use App\Dto\ConversationActivityIndexDto;
use App\Entity\ConversationActivity;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class ConversationActivityRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ConversationActivity::class);
    }

    final public function save(ConversationActivity $conversationActivity): void
    {
        $em = $this->getEntityManager();
        $em->persist($conversationActivity);
        $em->flush();
    }

    final public function delete(ConversationActivity $conversationActivity): void
    {
        $em = $this->getEntityManager();
        $em->remove($conversationActivity);
        $em->flush();
    }

    final public function findByUserIds(Uuid $senderUserId, Uuid $receiverUserId): ?ConversationActivity
    {
        /** @var ?ConversationActivity $conversationActivity */
        $conversationActivity = $this->findOneBy(
            ['senderUser' => $senderUserId, 'receiverUser' => $receiverUserId],
            ['createdAt' => 'DESC'],
        );

        return $conversationActivity;
    }

    /** @return ConversationActivity[] */
    final public function findActivities(Uuid $userId, ConversationActivityIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('c');

        if ($dto->filter->userId) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->andX(
                        $qb->expr()->eq('c.senderUser', ':userId1'),
                        $qb->expr()->eq('c.receiverUser', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('c.senderUser', ':userId2'),
                        $qb->expr()->eq('c.receiverUser', ':userId1'),
                    ),
                ),
            )
                ->setParameter('userId1', $userId)
                ->setParameter('userId2', $dto->filter->userId);
        } else {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->eq('c.senderUser', ':userId'),
                    $qb->expr()->eq('c.receiverUser', ':userId'),
                ),
            )
                ->setParameter('userId', $userId);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('c.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
