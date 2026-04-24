<?php

namespace App\Repository;

use App\Entity\TrainingDisciplineSubDistance;
use Doctrine\Persistence\ManagerRegistry;

class TrainingDisciplineSubDistanceRepository extends BaseRepository
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

    final public function delete(TrainingDisciplineSubDistance $trainingDisciplineSubDistance): void
    {
        $em = $this->getEntityManager();
        $em->remove($trainingDisciplineSubDistance);
        $em->flush();
    }
}
