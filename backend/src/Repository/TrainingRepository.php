<?php

namespace App\Repository;

use App\Entity\Training;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class TrainingRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Training::class);
    }

    final public function save(Training $training): void
    {
        $em = $this->getEntityManager();
        $em->persist($training);
        $em->flush();
    }

    final public function findById(Uuid $trainingId): ?Training
    {
        /** @var ?Training $training */
        $training = $this->find($trainingId);

        return $training;
    }
}
