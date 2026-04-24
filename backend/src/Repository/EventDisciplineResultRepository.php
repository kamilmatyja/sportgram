<?php

namespace App\Repository;

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

    final public function delete(EventDisciplineResult $eventDisciplineResult): void
    {
        $em = $this->getEntityManager();
        $em->remove($eventDisciplineResult);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineResultId): EventDisciplineResult
    {
        /** @var EventDisciplineResult $eventDisciplineResult */
        $eventDisciplineResult = $this->findOrFail($eventDisciplineResultId);

        return $eventDisciplineResult;
    }
}
