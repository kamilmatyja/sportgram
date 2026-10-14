<?php

namespace App\Repository;

use App\Dto\EventListIndexDto;
use App\Entity\EventDisciplineList;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventDisciplineListRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EventDisciplineList::class);
    }

    final public function save(EventDisciplineList $eventDisciplineList): void
    {
        $em = $this->getEntityManager();
        $em->persist($eventDisciplineList);
        $em->flush();
    }

    final public function delete(EventDisciplineList $eventDisciplineList): void
    {
        $em = $this->getEntityManager();
        $em->remove($eventDisciplineList);
        $em->flush();
    }

    final public function findById(Uuid $eventDisciplineListId): EventDisciplineList
    {
        /** @var EventDisciplineList $eventDisciplineList */
        $eventDisciplineList = $this->findOrfail($eventDisciplineListId);

        return $eventDisciplineList;
    }

    final public function findLists(Uuid $eventDisciplineDistanceId, EventListIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('e');

        $qb->andWhere('e.eventDisciplineDistance = :eventDisciplineDistanceId')
            ->setParameter('eventDisciplineDistanceId', $eventDisciplineDistanceId);

        if ($dto->filter->userId) {
            $qb->andWhere('e.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->status) {
            $qb->andWhere('e.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('e.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
