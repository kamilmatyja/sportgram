<?php

namespace App\Repository;

use App\Dto\PageFollowIndexDto;
use App\Entity\PageFollow;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class PageFollowRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageFollow::class);
    }

    final public function save(PageFollow $pageFollow): void
    {
        $em = $this->getEntityManager();
        $em->persist($pageFollow);
        $em->flush();
    }

    final public function delete(PageFollow $pageFollow): void
    {
        $em = $this->getEntityManager();
        $em->remove($pageFollow);
        $em->flush();
    }

    final public function findById(Uuid $pageFollowId): PageFollow
    {
        /** @var PageFollow $pageFollow */
        $pageFollow = $this->findOrFail($pageFollowId);

        return $pageFollow;
    }

    /** @return PageFollow[] */
    final public function findPageFollows(PageFollowIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('p');

        if ($dto->filter->userId) {
            $qb->andWhere('p.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if (! empty($dto->filter->pageIds)) {
            $qb->leftJoin('e.pages', 'pa')
                ->andWhere('p.pageId IN (:pageIds)')
                ->setParameter('pageIds', $dto->filter->pageIds);
        }

        if ($dto->filter->status) {
            $qb->andWhere('p.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('p.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    final public function hasRow(Uuid $userId, Uuid $pageId): bool
    {
        $qb = $this->createQueryBuilder('p');
        $qb->select('COUNT(p.id)')
            ->andWhere('p.user = :userId')
            ->andWhere('p.page = :pageId')
            ->setParameter('userId', $userId)
            ->setParameter('pageId', $pageId);

        $count = $qb->getQuery()->getSingleScalarResult();

        return (int)$count > 0;
    }
}
