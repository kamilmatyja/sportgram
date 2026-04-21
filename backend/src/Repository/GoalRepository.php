<?php

namespace App\Repository;

use App\Entity\Goal;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class GoalRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Goal::class);
    }

    final public function save(Goal $goal): void
    {
        $em = $this->getEntityManager();
        $em->persist($goal);
        $em->flush();
    }

    final public function findById(Uuid $id): ?Goal
    {
        /** @var ?Goal $goal */
        $goal = $this->find($id);

        return $goal;
    }
}
