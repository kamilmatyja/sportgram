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

    final public function findById(Uuid $goalId): ?Goal
    {
        /** @var ?Goal $goal */
        $goal = $this->find($goalId);

        return $goal;
    }

    final public function findWithParticipants(Uuid $goalId): ?Goal
    {
        return $this->createQueryBuilder('g')
            ->leftJoin('g.participants', 'p')
            ->addSelect('p')
            ->where('g.id = :id')
            ->setParameter('id', $goalId)
            ->getQuery()
            ->getOneOrNullResult();
    }

    final public function findWithParticipantResults(Uuid $goalId): ?Goal
    {
        return $this->createQueryBuilder('g')
            ->leftJoin('g.participants', 'p')
            ->leftJoin('p.results', 'r')
            ->addSelect('p')
            ->addSelect('r')
            ->where('g.id = :id')
            ->setParameter('id', $goalId)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
