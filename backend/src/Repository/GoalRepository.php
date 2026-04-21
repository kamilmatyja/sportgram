<?php

namespace App\Repository;

use App\Dto\{GoalIndexDto};
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

    final public function findGoals(GoalIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('g');

        if ($dto->filter->userId) {
            $qb->leftJoin('g.participants', 'p')
                ->andWhere('p.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->text) {
            $qb->andWhere('g.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->discipline) {
            $qb->andWhere('g.discipline = :discipline')
                ->setParameter('discipline', $dto->filter->discipline);
        }

        if ($dto->filter->distance) {
            $qb->andWhere('g.distance = :distance')
                ->setParameter('distance', $dto->filter->distance);
        }

        if ($dto->filter->time) {
            $qb->andWhere('g.time = :time')
                ->setParameter('time', $dto->filter->time);
        }

        if ($dto->filter->status) {
            $qb->andWhere('g.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('g.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
