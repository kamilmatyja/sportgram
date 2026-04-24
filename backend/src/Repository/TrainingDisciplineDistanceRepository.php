<?php

namespace App\Repository;

use App\Entity\TrainingDisciplineDistance;
use Doctrine\Persistence\ManagerRegistry;

class TrainingDisciplineDistanceRepository extends BaseRepository
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

    final public function delete(TrainingDisciplineDistance $trainingDisciplineDistance): void
    {
        $em = $this->getEntityManager();
        $em->remove($trainingDisciplineDistance);
        $em->flush();
    }
}
