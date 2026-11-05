<?php

namespace App\Repository;

use App\Dto\FeedCommentIndexDto;
use App\Entity\FeedComment;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class FeedCommentRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FeedComment::class);
    }

    final public function save(FeedComment $feedComment): void
    {
        $em = $this->getEntityManager();
        $em->persist($feedComment);
        $em->flush();
    }

    final public function delete(FeedComment $feedComment): void
    {
        $em = $this->getEntityManager();
        $em->remove($feedComment);
        $em->flush();
    }

    final public function findById(Uuid $feedCommentId): FeedComment
    {
        /** @var FeedComment $feedComment */
        $feedComment = $this->findOrFail($feedCommentId);

        return $feedComment;
    }

    final public function findComments(FeedCommentIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('c');

        if ($dto->filter->userId) {
            $qb->andWhere('c.user = :userId')
                ->setParameter('userId', $dto->filter->userId);
        }

        if ($dto->filter->feedId) {
            $qb->andWhere('c.feed = :feedId')
                ->setParameter('feedId', $dto->filter->feedId);
        }

        if ($dto->filter->text) {
            $qb->andWhere('s.text LIKE :text')
                ->setParameter('text', '%' . $dto->filter->text . '%');
        }

        if ($dto->filter->status) {
            $qb->andWhere('c.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        $this->order($dto->sort, $qb, 'c');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
