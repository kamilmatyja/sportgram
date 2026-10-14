<?php

namespace App\Repository;

use App\Dto\PushSubscriptionIndexDto;
use App\Entity\PushSubscription;
use App\Enum\PushSubscriptionStatusEnum;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class PushSubscriptionRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PushSubscription::class);
    }

    final public function save(PushSubscription $pushSubscription): void
    {
        $em = $this->getEntityManager();
        $em->persist($pushSubscription);
        $em->flush();
    }

    final public function delete(PushSubscription $pushSubscription): void
    {
        $em = $this->getEntityManager();
        $em->remove($pushSubscription);
        $em->flush();
    }

    final public function findById(Uuid $pushSubscriptionId): PushSubscription
    {
        /** @var PushSubscription $pushSubscription */
        $pushSubscription = $this->findOrFail($pushSubscriptionId);

        return $pushSubscription;
    }

    final public function findActiveByUserId(Uuid $userId): WindowPage
    {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.user = :userId')
            ->andWhere('p.status = :status')
            ->setParameter('userId', $userId)
            ->setParameter('status', PushSubscriptionStatusEnum::Active);

        return new OffsetPaginator()->paginate($qb);
    }

    final public function findPushSubscriptions(Uuid $userId, PushSubscriptionIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.user = :userId')
            ->setParameter('userId', $userId);

        if ($dto->filter->endpoint) {
            $qb->andWhere('p.endpoint = :endpoint')
                ->setParameter('endpoint', $dto->filter->endpoint);
        }

        if ($dto->filter->p256dh) {
            $qb->andWhere('p.p256dh = :p256dh')
                ->setParameter('p256dh', $dto->filter->p256dh);
        }

        if ($dto->filter->auth) {
            $qb->andWhere('p.auth = :auth')
                ->setParameter('auth', $dto->filter->auth);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('p.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
