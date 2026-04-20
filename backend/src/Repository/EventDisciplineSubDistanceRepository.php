<?php

namespace App\Repository;

use App\Entity\EventDisciplineSubDistance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineSubDistanceRepository extends ServiceEntityRepository
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
}
