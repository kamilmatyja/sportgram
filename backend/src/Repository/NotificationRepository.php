<?php

namespace App\Repository;

use App\Dto\NotificationIndexDto;
use App\Entity\Notification;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class NotificationRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notification::class);
    }

    final public function save(Notification $notification): void
    {
        $em = $this->getEntityManager();
        $em->persist($notification);
        $em->flush();
    }

    final public function delete(Notification $notification): void
    {
        $em = $this->getEntityManager();
        $em->remove($notification);
        $em->flush();
    }

    final public function findById(Uuid $notificationId): Notification
    {
        /** @var Notification $notification */
        $notification = $this->findOrFail($notificationId);

        return $notification;
    }

    /** @return Notification[] */
    final public function findNotifications(Uuid $userId, NotificationIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('n')
            ->where('n.user = :userId')
            ->setParameter('userId', $userId);

        if ($dto->filter->text) {
            $qb->andWhere('n.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('n.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('n.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
