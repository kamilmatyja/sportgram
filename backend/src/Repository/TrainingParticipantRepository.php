<?php

namespace App\Repository;

use App\Entity\TrainingParticipant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TrainingParticipantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingParticipant::class);
    }

    final public function save(TrainingParticipant $trainingParticipant): void
    {
        $em = $this->getEntityManager();
        $em->persist($trainingParticipant);
        $em->flush();
    }
}
