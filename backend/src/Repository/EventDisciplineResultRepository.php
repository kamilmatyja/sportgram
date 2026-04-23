<?php

namespace App\Repository;

use App\Dto\EventResultIndexDto;
use App\Entity\EventDisciplineResult;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventDisciplineResultRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineResult::class);
    }

    final public function save(EventDisciplineResult $eventDisciplineResult): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineResult);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineResultId): EventDisciplineResult
    {
        /** @var EventDisciplineResult $eventDisciplineResult */
        $eventDisciplineResult = $this->findOrFail($eventDisciplineResultId);

        return $eventDisciplineResult;
    }

    final public function findResults(Uuid $eventDisciplineDistanceId, EventResultIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        $qb->andWhere('e.event_discipline_distance = :eventDisciplineDistanceId')
            ->setParameter('eventDisciplineDistanceId', $eventDisciplineDistanceId);

        if ($dto->filter->userId) {
            $qb->andWhere('e.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
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
