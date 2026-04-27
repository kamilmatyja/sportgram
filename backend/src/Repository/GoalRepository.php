<?php

namespace App\Repository;

use App\Dto\{GoalIndexDto};
use App\Entity\Goal;
use App\Enum\{DisciplineEnum, GoalStatusEnum};
use DateTimeImmutable;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class GoalRepository extends BaseRepository
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

    final public function delete(Goal $goal): void
    {
        $em = $this->getEntityManager();
        $em->remove($goal);
        $em->flush();
    }

    final public function findById(Uuid $goalId): Goal
    {
        /** @var Goal $goal */
        $goal = $this->findOrFail($goalId);

        return $goal;
    }

    final public function findActiveByDiscipline(
        Uuid $userId,
        DisciplineEnum $discipline,
        DateTimeImmutable $date,
    ): array {
        $qb = $this->createQueryBuilder('g');
        $qb->leftJoin('g.participants', 'p')
            ->andWhere('p.user = :userId')
            ->setParameter('userId', $userId);
        $qb->andWhere('g.discipline = :discipline')
            ->setParameter('discipline', $discipline);
        $qb->andWhere('g.startedAt <= :now')
            ->setParameter('now', $date);
        $qb->andWhere('g.endedAt >= :now')
            ->setParameter('now', $date);
        $qb->andWhere('g.status = :status')
            ->setParameter('status', GoalStatusEnum::Active);
    }

    final public function findGoals(GoalIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('g');

        $qb->leftJoin('g.participants', 'p')
            ->andWhere('p.user = :userId')
            ->setParameter('userId', $dto->filter->userId);

        if ($dto->filter->link) {
            $qb->andWhere('g.link = :link')
                ->setParameter('link', $dto->filter->link);
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

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('g.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
