<?php

namespace App\Repository;

use App\Dto\EventListIndexDto;
use App\Entity\EventDisciplineList;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventDisciplineListRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineList::class);
    }

    final public function save(EventDisciplineList $eventDisciplineList): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineList);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineListId): EventDisciplineList
    {
        /** @var EventDisciplineList $eventDisciplineList */
        $eventDisciplineList = $this->findOrfail($eventDisciplineListId);

        return $eventDisciplineList;
    }

    final public function findLists(Uuid $eventDisciplineDistanceId, EventListIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        $qb->andWhere('e.event_discipline_distance = :eventDisciplineDistanceId')
            ->setParameter('eventDisciplineDistanceId', $eventDisciplineDistanceId);

        if ($dto->filter->userId) {
            $qb->andWhere('e.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
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
