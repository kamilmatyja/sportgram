<?php

namespace App\Repository;

use App\Dto\StoryIndexDto;
use App\Entity\Story;
use App\Enum\FriendStatusEnum;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
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

    final public function findStories(Uuid $userId, StoryIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('s');

        if ($dto->filter->userId) {
            $qb->andWhere('s.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        } else {
            $qb->leftJoin(
                'App\\Entity\\Friend',
                'fr',
                'WITH',
                '((fr.senderUser = s.user AND fr.receiverUser = :userId) OR (fr.senderUser = :userId AND fr.receiverUser = s.user))',
            );
            $qb->andWhere('(s.user = :userId OR (fr.id IS NOT NULL AND fr.status = :acceptedStatus))')
                ->setParameter('userId', $userId)
                ->setParameter('acceptedStatus', FriendStatusEnum::Accepted->value);
        }

        if ($dto->filter->text) {
            $qb->andWhere('s.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('s.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        $this->order($dto->sort, $qb, 's');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
