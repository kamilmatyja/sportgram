<?php

namespace App\Repository;

use App\Dto\ConversationIndexDto;
use App\Entity\Conversation;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
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

    final public function findConversations(Uuid $userId, ConversationIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('c');

        if ($dto->filter->userId) {
            $qb->andWhere('(c.senderUser = :userId1 AND c.receiverUser = :userId2) OR (c.senderUser = :userId2 AND c.receiverUser = :userId1)')
                ->setParameter('userId1', $userId)
                ->setParameter('userId2', $dto->filter->userId);
        } else {
            $subDql = $this->createQueryBuilder('c2')
                ->select('1')
                ->where('(c2.senderUser = c.senderUser AND c2.receiverUser = c.receiverUser) OR (c2.senderUser = c.receiverUser AND c2.receiverUser = c.senderUser)')
                ->andWhere('c2.createdAt > c.createdAt OR (c2.createdAt = c.createdAt AND c2.id > c.id)')
                ->getDQL();

            $qb->andWhere('c.senderUser = :userId OR c.receiverUser = :userId')
                ->andWhere("NOT EXISTS ({$subDql})")
                ->setParameter('userId', $userId);
        }

        if ($dto->filter->status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        $this->order($dto->sort, $qb, 'c');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
