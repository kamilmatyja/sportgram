<?php

namespace App\Repository;

use App\Entity\TrainingDisciplineSubDistance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TrainingDisciplineSubDistanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingDisciplineSubDistance::class);
    }

    final public function save(TrainingDisciplineSubDistance $trainingDisciplineSubDistance): void
    {
        $em = $this->getEntityManager();
        $em->persist($trainingDisciplineSubDistance);
        $em->flush();
    }
}
