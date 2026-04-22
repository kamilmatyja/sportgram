<?php

namespace App\Repository;

use App\Dto\StoryIndexDto;
use App\Entity\Story;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class StoryRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Story::class);
    }

    final public function save(Story $story): void
    {
        $em = $this->getEntityManager();
        $em->persist($story);
        $em->flush();
    }

    final public function findById(Uuid $storyId): Story
    {
        /** @var ?Story $story */
        $story = $this->findOrFail($storyId);

        return $story;
    }

    final public function findStories(StoryIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('s');

        if ($dto->filter->userId) {
            $qb->andWhere('s.user_id = :user_id')
                ->setParameter('user_id', $dto->filter->userId);
        } else {
            $qb->select('s')
                ->addSelect('MAX(s.created_at) AS HIDDEN max_created_at')
                ->groupBy('s.user_id');
            $qb->orderBy('max_created_at', 'DESC');
        }

        if ($dto->filter->text) {
            $qb->andWhere('s.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('s.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('s.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        // TODO - zawęzić o listę znajomych
        // TODO - zawęzić o niewyświetlone

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
