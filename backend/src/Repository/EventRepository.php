<?php

namespace App\Repository;

use App\Dto\EventIndexDto;
use App\Entity\Event;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    final public function save(Event $event): void
    {
        $em = $this->getEntityManager();
        $em->persist($event);
        $em->flush();
    }

    final public function findById(Uuid $eventId): Event
    {
        /** @var ?Event $event */
        $event = $this->findOrFail($eventId);

        return $event;
    }

    final public function findEvents(EventIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        if ($dto->filter->userId) {
            $qb->leftJoin('e.participants', 'p')
                ->andWhere('p.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->pageId) {
            $qb->leftJoin('e.pages', 'p')
                ->andWhere('p.page = :pageId')
                ->setParameter('pageId', $dto->filter->pageId);
        }

        if ($dto->filter->title) {
            $qb->andWhere('e.title LIKE :title')
                ->setParameter('title', '%' . $dto->filter->title . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('e.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $dbField = $this->camelCaseToSnakeCase($field);
        $qb->orderBy('t.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
