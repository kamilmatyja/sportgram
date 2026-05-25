<?php

namespace App\Repository;

use App\Dto\EventIndexDto;
use App\Entity\Event;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class EventRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Event::class);
    }

    final public function save(Event $event): void
    {
        $em = $this->getEntityManager();
        $em->persist($event);
        $em->flush();
    }

    final public function delete(Event $event): void
    {
        $em = $this->getEntityManager();
        $em->remove($event);
        $em->flush();
    }

    final public function findById(Uuid $eventId): Event
    {
        /** @var Event $event */
        $event = $this->findOrFail($eventId);

        return $event;
    }

    /** @return Event[] */
    final public function findEvents(EventIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('e');

        if ($dto->filter->userId) {
            $qb->leftJoin('e.pageParticipant', 'p')
                ->andWhere('p.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->pageId) {
            $qb->leftJoin('e.pageParticipant', 'p')
                ->andWhere('p.page = :pageId')
                ->setParameter('pageId', $dto->filter->pageId);
        }

        if ($dto->filter->link) {
            $qb->andWhere('e.link = :link')
                ->setParameter('link', $dto->filter->link);
        }

        if ($dto->filter->title) {
            $qb->andWhere('e.title LIKE :title')
                ->setParameter('title', '%' . $dto->filter->title . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('e.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('e.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
