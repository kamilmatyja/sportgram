<?php

namespace App\Repository;

use App\Dto\EntryIndexDto;
use App\Entity\Entry;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Entry::class);
    }

    final public function save(Entry $entry): void
    {
        $em = $this->getEntityManager();
        $em->persist($entry);
        $em->flush();
    }

    final public function findById(Uuid $entryId): ?Entry
    {
        /** @var ?Entry $entry */
        $entry = $this->find($entryId);

        return $entry;
    }

    final public function findEntries(EntryIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        if ($dto->filter->userId) {
            $qb->andWhere('e.user_id = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->entityId) {
            $qb->andWhere('e.entity_id = :entityId')
                ->setParameter('entityId', $dto->filter->entityId);
        }

        if ($dto->filter->type) {
            $qb->andWhere('e.type = :type')
                ->setParameter('type', $dto->filter->type);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('e.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
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
