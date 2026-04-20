<?php

namespace App\Repository;

use App\Entity\TrainingDisciplineDistance;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class TrainingDisciplineDistanceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingDisciplineDistance::class);
    }

    final public function save(TrainingDisciplineDistance $trainingDisciplineDistance): void
    {
        $em = $this->getEntityManager();
        $em->persist($trainingDisciplineDistance);
        $em->flush();
    }
}
