<?php

namespace App\Repository;

use App\Entity\GoalParticipant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class GoalParticipantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GoalParticipant::class);
    }

    final public function save(GoalParticipant $goalParticipant): void
    {
        $em = $this->getEntityManager();
        $em->persist($goalParticipant);
        $em->flush();
    }
}
