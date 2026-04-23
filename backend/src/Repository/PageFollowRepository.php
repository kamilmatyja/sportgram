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

    final public function findById(Uuid $pageFollowId): PageFollow
    {
        /** @var ?PageFollow $pageFollow */
        $pageFollow = $this->findOrFail($pageFollowId);

        return $pageFollow;
    }

    final public function findPageFollows(PageFollowIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('p');

        if ($dto->filter->userId) {
            $qb->andWhere('p.user_id = :userId')
                ->setParameter('userId', $dto->filter->userId);
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
