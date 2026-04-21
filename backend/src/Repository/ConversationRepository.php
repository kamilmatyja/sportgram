<?php

namespace App\Repository;

use App\Dto\ConversationIndexDto;
use App\Entity\Conversation;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class ConversationRepository extends ServiceEntityRepository
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

    final public function findById(Uuid $conversationId): ?Conversation
    {
        /** @var ?Conversation $conversation */
        $conversation = $this->find($conversationId);

        return $conversation;
    }

    final public function findConversations(Uuid $userId, ConversationIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('c');

        if ($dto->filter->userId) {
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->andX(
                        $qb->expr()->eq('c.sender_user_id', ':userId1'),
                        $qb->expr()->eq('c.receiver_user_id', ':userId2'),
                    ),
                    $qb->expr()->andX(
                        $qb->expr()->eq('c.sender_user_id', ':userId2'),
                        $qb->expr()->eq('c.receiver_user_id', ':userId1'),
                    ),
                ),
            )
                ->setParameter('userId1', $userId)
                ->setParameter('userId2', $dto->filter->userId);
        } else {
            $qb->select(
                'c, DISTINCT CASE WHEN c.sender_user_id = :userId THEN c.receiver_user_id ELSE c.sender_user_id END AS HIDDEN other_user_id',
            );
            $qb->andWhere(
                $qb->expr()->orX(
                    $qb->expr()->eq('c.sender_user_id', ':userId'),
                    $qb->expr()->eq('c.receiver_user_id', ':userId'),
                ),
            )
                ->setParameter('userId', $userId);
            $qb->groupBy('other_user_id');
        }

        if ($dto->filter->status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('c.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
