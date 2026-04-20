<?php

namespace App\Repository;

use App\Entity\EventDisciplineResult;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class EventDisciplineResultRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineResult::class);
    }

    final public function save(EventDisciplineResult $eventDisciplineResult): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineResult);
        $em->flush();
    }
}
