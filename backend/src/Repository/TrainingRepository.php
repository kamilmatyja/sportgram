<?php

namespace App\Repository;

use App\Dto\TrainingIndexDto;
use App\Entity\Training;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class TrainingRepository extends BaseRepository
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

    final public function delete(Training $training): void
    {
        $em = $this->getEntityManager();
        $em->remove($training);
        $em->flush();
    }

    final public function findById(Uuid $trainingId): Training
    {
        /** @var ?Training $training */
        $training = $this->findOrFail($trainingId);

        return $training;
    }

    final public function findTrainings(TrainingIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('t');

        $qb->leftJoin('t.participants', 'p')
            ->andWhere('p.user = :userId')
            ->setParameter('userId', $dto->filter->userId);

        if ($dto->filter->link) {
            $qb->andWhere('t.link = :link')
                ->setParameter('link', $dto->filter->link);
        }

        if ($dto->filter->title) {
            $qb->andWhere('t.title LIKE :title')
                ->setParameter('title', '%' . $dto->filter->title . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('t.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $dbField = $this->camelCaseToSnakeCase($field);
        $qb->orderBy('t.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
