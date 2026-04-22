<?php

namespace App\Repository;

use App\Entity\EventDisciplineList;
use Doctrine\Persistence\ManagerRegistry;

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
}
