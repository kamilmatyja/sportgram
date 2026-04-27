<?php

namespace App\Repository;

use App\Dto\StoryIndexDto;
use App\Entity\Story;
use App\Enum\FriendStatusEnum;
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

    final public function delete(Story $story): void
    {
        $em = $this->getEntityManager();
        $em->remove($story);
        $em->flush();
    }

    final public function findById(Uuid $storyId): Story
    {
        /** @var Story $story */
        $story = $this->findOrFail($storyId);

        return $story;
    }

    final public function findStories(Uuid $userId, StoryIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('s');

        if ($dto->filter->userId) {
            $qb->andWhere('s.user = :user_id')
                ->setParameter('user_id', $dto->filter->userId);
        } else {
            $qb->leftJoin(
                'friends',
                'fr',
                '(
                    (fr.sender_user = s.user_id AND fr.receiver_user = :userId)
                    OR (fr.sender_user = :userId AND fr.receiver_user = s.user_id)
                )',
            );
            $qb->andWhere('(s.user = :userId OR (fr.id IS NOT NULL AND fr.status = :acceptedStatus))')
                ->setParameter('userId', $userId)
                ->setParameter('acceptedStatus', FriendStatusEnum::Accepted->value);
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

        [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
        $qb->orderBy('s.' . $field, $direction === 'desc' ? 'DESC' : 'ASC');

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
