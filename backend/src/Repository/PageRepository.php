<?php

namespace App\Repository;

use App\Dto\PageIndexDto;
use App\Entity\Page;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class PageRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Page::class);
    }

    final public function save(Page $page): void
    {
        $em = $this->getEntityManager();
        $em->persist($page);
        $em->flush();
    }

    final public function delete(Page $page): void
    {
        $em = $this->getEntityManager();
        $em->remove($page);
        $em->flush();
    }

    final public function findById(Uuid $pageId): Page
    {
        /** @var ?Page $page */
        $page = $this->findOrFail($pageId);

        return $page;
    }

    final public function findPages(PageIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('p');

        if ($dto->filter->userId) {
            $qb->leftJoin('p.participants', 'p')
                ->andWhere('p.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->link) {
            $qb->andWhere('p.link = :link')
                ->setParameter('link', $dto->filter->link);
        }

        if ($dto->filter->title) {
            $qb->andWhere('p.title LIKE :title')
                ->setParameter('title', '%' . $dto->filter->title . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('p.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $dbField = $this->camelCaseToSnakeCase($field);
        $qb->orderBy('p.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
