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
            )->setParameter('userId', $userId);

            $subQb = $this->getEntityManager()->createQueryBuilder();
            $subQb->select('1')
                ->from(\App\Entity\Conversation::class, 'c2')
                ->where(
                    $subQb->expr()->orX(
                        $subQb->expr()->eq('c2.senderUser', ':userId'),
                        $subQb->expr()->eq('c2.receiverUser', ':userId'),
                    ),
                )
                ->andWhere(
                    $subQb->expr()->orX(
                        $subQb->expr()->andX(
                            $subQb->expr()->eq('c2.senderUser', 'c.senderUser'),
                            $subQb->expr()->eq('c2.receiverUser', 'c.receiverUser'),
                        ),
                        $subQb->expr()->andX(
                            $subQb->expr()->eq('c2.senderUser', 'c.receiverUser'),
                            $subQb->expr()->eq('c2.receiverUser', 'c.senderUser'),
                        ),
                    ),
                )
                ->andWhere(
                    $subQb->expr()->orX(
                        $subQb->expr()->gt('c2.createdAt', 'c.createdAt'),
                        $subQb->expr()->andX(
                            $subQb->expr()->eq('c2.createdAt', 'c.createdAt'),
                            $subQb->expr()->gt('c2.id', 'c.id'),
                        ),
                    ),
                );

            $qb->andWhere($qb->expr()->not($qb->expr()->exists($subQb->getDQL())));
        }

        if ($dto->filter->status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        $this->order($dto->sort, $qb, 'c');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
