<?php

namespace App\Repository;

use App\Entity\GoalParticipantResult;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class GoalParticipantResultRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GoalParticipantResult::class);
    }

    final public function save(GoalParticipantResult $goalParticipantResult): void
    {
        $em = $this->getEntityManager();
        $em->persist($goalParticipantResult);
        $em->flush();
    }
}
