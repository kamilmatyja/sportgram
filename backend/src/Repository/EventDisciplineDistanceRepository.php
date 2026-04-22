<?php

namespace App\Repository;

use App\Entity\EventDisciplineDistance;
use Doctrine\Persistence\ManagerRegistry;

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
}
