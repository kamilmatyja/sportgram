<?php

namespace App\Repository;

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
}
