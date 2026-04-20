<?php

namespace App\Repository;

use App\Dto\PushSubscriptionIndexDto;
use App\Entity\PushSubscription;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class PushSubscriptionRepository extends ServiceEntityRepository
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

    final public function findById(Uuid $pushSubscriptionId): ?PushSubscription
    {
        /** @var ?PushSubscription $pushSubscription */
        $pushSubscription = $this->find($pushSubscriptionId);

        return $pushSubscription;
    }

    final public function findPushSubscriptions(Uuid $userId, PushSubscriptionIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('p')
            ->andWhere('p.user_id = :user_id')
            ->setParameter('user_id', $userId);

        if ($dto->filter->endpoint !== null) {
            $qb->andWhere('p.endpoint = :endpoint')
                ->setParameter('endpoint', $dto->filter->endpoint);
        }

        if ($dto->filter->p256dh) {
            $qb->andWhere('p.p256dh LIKE :p256dh')
                ->setParameter('p256dh', '%' . $dto->filter->p256dh . '%');
        }

        if ($dto->filter->auth) {
            $qb->andWhere('p.auth = :auth')
                ->setParameter('auth', '%' . $dto->filter->auth . '%');
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $qb->orderBy('u.' . $field, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
