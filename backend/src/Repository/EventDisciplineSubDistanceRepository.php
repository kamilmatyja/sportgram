<?php

namespace App\Repository;

use App\Entity\EventDisciplineSubDistance;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventDisciplineSubDistanceRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineSubDistance::class);
    }

    final public function save(EventDisciplineSubDistance $eventDisciplineSubDistance): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineSubDistance);
        $em->flush();
    }

    final public function delete(EventDisciplineSubDistance $eventDisciplineSubDistance): void
    {
        $em = $this->getEntityManager();
        $em->remove($eventDisciplineSubDistance);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineSubDistanceId): EventDisciplineSubDistance
    {
        /** @var EventDisciplineSubDistance $eventDisciplineSubDistance */
        $eventDisciplineSubDistance = $this->findOrFail($eventDisciplineSubDistanceId);

        return $eventDisciplineSubDistance;
    }
}
