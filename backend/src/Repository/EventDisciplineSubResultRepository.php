<?php

namespace App\Repository;

use App\Entity\EventDisciplineSubResult;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineSubResultRepository extends ServiceEntityRepository
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
}
