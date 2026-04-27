<?php

namespace App\Repository;

use App\Dto\EntryIndexDto;
use App\Entity\Entry;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EntryRepository extends BaseRepository
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

    final public function delete(Entry $entry): void
    {
        $em = $this->getEntityManager();
        $em->remove($entry);
        $em->flush();
    }

    final public function findById(Uuid $entryId): Entry
    {
        /** @var ?Entry $entry */
        $entry = $this->findOrFail($entryId);

        return $entry;
    }

    final public function findEntries(EntryIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        if ($dto->filter->userId) {
            $qb->andWhere('e.user_id = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if (! empty($dto->filter->entityIds)) {
            $qb->andWhere('e.entity_id IN (:entityIds)')
                ->setParameter('entityIds', $dto->filter->entityIds);
        }

        if ($dto->filter->type) {
            $qb->andWhere('e.type = :type')
                ->setParameter('type', $dto->filter->type);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $dbField = $this->camelCaseToSnakeCase($field);
        $qb->orderBy('e.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
