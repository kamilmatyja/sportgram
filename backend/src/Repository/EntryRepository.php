<?php

namespace App\Repository;

use App\Dto\{EntryCountDto, EntryCountIndexDto, EntryIndexDto};
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
        /** @var Entry $entry */
        $entry = $this->findOrFail($entryId);

        return $entry;
    }

    /** @return Entry[] */
    final public function findEntries(EntryIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        if ($dto->filter->userId) {
            $qb->andWhere('e.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if (! empty($dto->filter->entityIds)) {
            $qb->andWhere('e.entityId IN (:entityIds)')
                ->setParameter('entityIds', $dto->filter->entityIds);
        }

        if ($dto->filter->type) {
            $qb->andWhere('e.type = :type')
                ->setParameter('type', $dto->filter->type);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('e.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    /** @return EntryCountDto[] */
    final public function findCountEntries(EntryCountIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e')
            ->select('e.type as type, e.entityId, COUNT(e.id) as count');

        if (! empty($dto->filter->entityIds)) {
            $qb->andWhere('e.entityId IN (:entityIds)')
                ->setParameter('entityIds', $dto->filter->entityIds);
        }

        if ($dto->filter->type) {
            $qb->andWhere('e.type = :type')
                ->setParameter('type', $dto->filter->type);
        }

        $qb->groupBy('e.type')
            ->addGroupBy('e.entityId');

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy($field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        $rows = $qb->getQuery()->getResult();

        return array_map(fn (array $row) => new EntryCountDto(
            Uuid::fromString($row['entityId']),
            $row['type'],
            $row['count'],
        ), $rows);
    }
}
