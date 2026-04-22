<?php

namespace App\Repository;

use App\Entity\TrainingDiscipline;
use Doctrine\Persistence\ManagerRegistry;

class TrainingDisciplineRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingDiscipline::class);
    }

    final public function save(TrainingDiscipline $trainingDiscipline): void
    {
        $em = $this->getEntityManager();
        $em->persist($trainingDiscipline);
        $em->flush();
    }
}
