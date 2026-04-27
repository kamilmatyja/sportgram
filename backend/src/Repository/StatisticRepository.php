<?php

namespace App\Repository;

use App\Dto\StatisticIndexDto;
use Doctrine\DBAL\{Connection};
use Doctrine\Persistence\ManagerRegistry;

class StatisticRepository
{
    private Connection $connection;

    public function __construct(ManagerRegistry $registry)
    {
        $this->connection = $registry->getManager()->getConnection();
    }

    final public function getRecords(StatisticIndexDto $dto): array
    {
        $baseSql = '
        SELECT DISTINCT ON (user_id, discipline, distance)
            user_id,
            discipline,
            distance,
            time,
            created_at
        FROM (
            SELECT 
                u.id as user_id,
                d.discipline,
                t.distance,
                t.time,
                t.created_at
            FROM training_discipline_distances t
            JOIN training_disciplines d ON t.training_discipline_id = d.id
            JOIN trainings tr ON d.training_id = tr.id
            JOIN users u ON tr.user_id = u.id

            UNION ALL

            SELECT 
                u.id as user_id,
                ed.discipline,
                edd.distance,
                er.time,
                er.created_at
            FROM event_discipline_results er
            JOIN event_discipline_lists edl ON er.event_discipline_list_id = edl.id
            JOIN event_discipline_distances edd ON edl.event_discipline_distance_id = edd.id
            JOIN event_disciplines ed ON edd.event_discipline_id = ed.id
            JOIN users u ON er.user_id = u.id
        ) combined
        ORDER BY user_id, discipline, distance, time, created_at';

        $qb = $this->connection->createQueryBuilder();
        $qb->select('*')
            ->from('(' . $baseSql . ')', 'stats');

        if (! empty($dto->filter->userIds)) {
            $qb->andWhere('stats.user_id IN (:userIds)')
                ->setParameter('userIds', $dto->filter->userIds);
        }

        if ($dto->filter->discipline) {
            $qb->andWhere('stats.discipline = :discipline')
                ->setParameter('discipline', $dto->filter->discipline);
        }

        if ($dto->filter->distance) {
            $qb->andWhere('stats.distance = :distance')
                ->setParameter('distance', $dto->filter->distance);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('stats.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->executeQuery()->fetchAllAssociative();
    }

    final public function getProgress(StatisticIndexDto $dto): array
    {
        $baseSql = '
        SELECT 
            user_id,
            discipline,
            distance,
            time,
            created_at
        FROM (
            SELECT 
                u.id as user_id,
                d.discipline,
                t.distance,
                t.time,
                t.created_at
            FROM training_discipline_distances t
            JOIN training_disciplines d ON t.training_discipline_id = d.id
            JOIN trainings tr ON d.training_id = tr.id
            JOIN users u ON tr.user_id = u.id
    
            UNION ALL
    
            SELECT 
                u.id as user_id,
                ed.discipline,
                edd.distance,
                er.time,
                er.created_at
            FROM event_discipline_results er
            JOIN event_discipline_lists edl ON er.event_discipline_list_id = edl.id
            JOIN event_discipline_distances edd ON edl.event_discipline_distance_id = edd.id
            JOIN event_disciplines ed ON edd.event_discipline_id = ed.id
            JOIN users u ON er.user_id = u.id
        ) combined';

        $qb = $this->connection->createQueryBuilder();
        $qb->select('*')
            ->from('(' . $baseSql . ')', 'stats');

        if (! empty($dto->filter->userIds)) {
            $qb->andWhere('stats.user_id IN (:userIds)')
                ->setParameter('userIds', $dto->filter->userIds);
        }

        if ($dto->filter->discipline) {
            $qb->andWhere('stats.discipline = :discipline')
                ->setParameter('discipline', $dto->filter->discipline);
        }

        if ($dto->filter->distance) {
            $qb->andWhere('stats.distance = :distance')
                ->setParameter('distance', $dto->filter->distance);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('stats.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->executeQuery()->fetchAllAssociative();
    }
}
