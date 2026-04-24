<?php

namespace App\Repository;

use App\Entity\EventDisciplineSubResult;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineSubResultRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineSubResult::class);
    }

    final public function save(EventDisciplineSubResult $eventDisciplineSubResult): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineSubResult);
        $em->flush();
    }

    final public function delete(EventDisciplineSubResult $eventDisciplineSubResult): void
    {
        $em = $this->getEntityManager();
        $em->remove($eventDisciplineSubResult);
        $em->flush();
    }
}
