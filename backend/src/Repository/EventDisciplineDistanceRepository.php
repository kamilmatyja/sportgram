<?php

namespace App\Repository;

use App\Entity\EventDisciplineDistance;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventDisciplineDistanceRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineDistance::class);
    }

    final public function save(EventDisciplineDistance $eventDisciplineDistance): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineDistance);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineDistanceId): EventDisciplineDistance
    {
        /** @var ?EventDisciplineDistance $eventDisciplineDistance */
        $eventDisciplineDistance = $this->findOrFail($eventDisciplineDistanceId);

        return $eventDisciplineDistance;
    }
}
