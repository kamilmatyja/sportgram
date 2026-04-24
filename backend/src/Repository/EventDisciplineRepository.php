<?php

namespace App\Repository;

use App\Entity\EventDiscipline;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDiscipline::class);
    }

    final public function save(EventDiscipline $eventDiscipline): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDiscipline);
        $em->flush();
    }

    final public function delete(EventDiscipline $eventDiscipline): void
    {
        $em = $this->getEntityManager();
        $em->remove($eventDiscipline);
        $em->flush();
    }
}
