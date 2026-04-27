<?php

namespace App\Repository;

use App\Dto\ConversationIndexDto;
use App\Entity\Conversation;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class ConversationRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Conversation::class);
    }

    final public function save(Conversation $conversation): void
    {
        $em = $this->getEntityManager();
        $em->persist($conversation);
        $em->flush();
    }

    final public function delete(Conversation $conversation): void
    {
        $em = $this->getEntityManager();
        $em->remove($conversation);
        $em->flush();
    }

    final public function findById(Uuid $conversationId): Conversation
    {
        /** @var Conversation $conversation */
        $conversation = $this->findOrFail($conversationId);

        return $conversation;
    }

    final public function findConversations(Uuid $userId, ConversationIndexDto $dto): array
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
            $qb->select(
                'c, DISTINCT CASE WHEN c.senderUser = :userId THEN c.receiverUser ELSE c.senderUser END AS HIDDEN otherUser',
            );
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->eq('c.senderUser', ':userId'),
                    $qb->expr()->eq('c.receiverUser', ':userId'),
                ),
            )
                ->setParameter('userId', $userId);
            $qb->groupBy('otherUser');
        }

        if ($dto->filter->status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('c.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
