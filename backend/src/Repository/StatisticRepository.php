<?php

namespace App\Repository;

use App\Dto\{StatisticIndexDto, StatisticResultDto};
use App\Entity\TrainingDisciplineDistance;
use DateMalformedStringException;
use DateTimeImmutable;
use Doctrine\DBAL\{ArrayParameterType, Exception};
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class StatisticRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TrainingDisciplineDistance::class);
    }

    /**
     * @throws Exception
     * @throws DateMalformedStringException
     */
    final public function findRecords(StatisticIndexDto $dto): WindowPage
    {
        return $this->findStatistics($dto, true);
    }

    /**
     * @throws Exception
     * @throws DateMalformedStringException
     */
    final public function findProgress(StatisticIndexDto $dto): WindowPage
    {
        return $this->findStatistics($dto, false);
    }

    /**
     * @throws Exception
     * @throws DateMalformedStringException
     */
    private function findStatistics(
        StatisticIndexDto $dto,
        bool $recordsOnly,
    ): WindowPage {
        $conn = $this->getEntityManager()->getConnection();

        $qbTrainings = $conn->createQueryBuilder()
            ->select(
                'u.id AS "userId"',
                'd.discipline',
                't.distance',
                't.time',
                't.created_at AS "createdAt"',
            )
            ->from('training_discipline_distances', 't')
            ->join('t', 'training_disciplines', 'd', 't.training_discipline_id = d.id')
            ->join('d', 'trainings', 'tr', 'd.training_id = tr.id')
            ->join('tr', 'users', 'u', 'tr.user_id = u.id');

        $qbEvents = $conn->createQueryBuilder()
            ->select(
                'u.id AS "userId"',
                'ed.discipline',
                'edd.distance',
                'er.time',
                'er.created_at AS "createdAt"',
            )
            ->from('event_discipline_results', 'er')
            ->join('er', 'event_discipline_lists', 'edl', 'er.event_discipline_list_id = edl.id')
            ->join('edl', 'event_discipline_distances', 'edd', 'edl.event_discipline_distance_id = edd.id')
            ->join('edd', 'event_disciplines', 'ed', 'edd.event_discipline_id = ed.id')
            ->join('er', 'users', 'u', 'er.user_id = u.id');

        $unionSql = $qbTrainings->getSQL() . ' UNION ALL ' . $qbEvents->getSQL();

        $qb = $conn->createQueryBuilder()
            ->from("({$unionSql})", 'stats');

        if ($recordsOnly) {
            $qb->select(
                'DISTINCT ON (stats."userId", stats.discipline, stats.distance) stats."userId"',
                'stats.discipline',
                'stats.distance',
                'stats.time',
                'stats."createdAt"',
            )
                ->orderBy('stats."userId"', 'ASC')
                ->addOrderBy('stats.discipline', 'ASC')
                ->addOrderBy('stats.distance', 'ASC')
                ->addOrderBy('stats.time', 'ASC')
                ->addOrderBy('stats."createdAt"', 'ASC');
        } else {
            $qb->select(
                'stats."userId"',
                'stats.discipline',
                'stats.distance',
                'stats.time',
                'stats."createdAt"',
            );
        }

        if (! empty($dto->filter->userIds)) {
            $qb->andWhere('stats."userId" IN (:userIds)')
                ->setParameter('userIds', $dto->filter->userIds, ArrayParameterType::STRING);
        }

        if ($dto->filter->discipline) {
            $qb->andWhere('stats.discipline = :discipline')
                ->setParameter('discipline', $dto->filter->discipline);
        }

        if ($dto->filter->distance) {
            $qb->andWhere('stats.distance = :distance')
                ->setParameter('distance', $dto->filter->distance);
        }

        $this->order($dto->sort, $qb, 'stats');

        $page = new OffsetPaginator()->paginate(
            $qb,
            Window::fromPageNumberAndSize(
                $dto->page,
                $dto->limit,
            ),
        );

        $items = array_map(
            static fn (array $row): StatisticResultDto => new StatisticResultDto(
                Uuid::fromString($row['userId']),
                new DateTimeImmutable($row['createdAt']),
                $row['discipline'],
                $row['distance'],
                $row['time'],
            ),
            $page->getItems(),
        );

        return new WindowPage(
            $items,
            $page->getTotalCount(),
            $page->getWindow(),
        );
    }
}
