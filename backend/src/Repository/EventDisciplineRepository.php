<?php

namespace App\Repository;

use App\Entity\EventDiscipline;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineRepository extends ServiceEntityRepository
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
}
