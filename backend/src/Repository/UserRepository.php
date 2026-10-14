<?php

namespace App\Repository;

use App\Dto\UserIndexDto;
use App\Entity\User;
use Doctrine\ORM\Tools\Pagination\{OffsetPaginator, Window, WindowPage};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class UserRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }

    final public function save(User $user): void
    {
        $em = $this->getEntityManager();
        $em->persist($user);
        $em->flush();
    }

    final public function delete(User $user): void
    {
        $em = $this->getEntityManager();
        $em->remove($user);
        $em->flush();
    }

    final public function findById(Uuid $userId): User
    {
        /** @var User $user */
        $user = $this->findOrFail($userId);

        return $user;
    }

    final public function findByEmail(string $email): ?User
    {
        /** @var ?User $user */
        $user = $this->findOneBy(['email' => $email], ['createdAt' => 'DESC']);

        return $user;
    }

    final public function findUsers(UserIndexDto $dto): WindowPage
    {
        $qb = $this->createQueryBuilder('u');

        if ($dto->filter->firstName) {
            $qb->andWhere('u.firstName LIKE :firstName')
                ->setParameter('firstName', '%' . $dto->filter->firstName . '%');
        }

        if ($dto->filter->lastName) {
            $qb->andWhere('u.lastName LIKE :lastName')
                ->setParameter('lastName', '%' . $dto->filter->lastName . '%');
        }

        if ($dto->filter->gender) {
            $qb->andWhere('u.gender = :gender')
                ->setParameter('gender', $dto->filter->gender);
        }

        if ($dto->filter->email) {
            $qb->andWhere('u.email = :email')
                ->setParameter('email', $dto->filter->email);
        }

        if ($dto->filter->country) {
            $qb->andWhere('u.country = :country')
                ->setParameter('country', $dto->filter->country);
        }

        if ($dto->filter->status) {
            $qb->andWhere('u.status = :status')
                ->setParameter('status', $dto->filter->status);
        }

        if (! empty($dto->filter->userIds)) {
            $qb->andWhere('u.id IN (:userIds)')
                ->setParameter('userIds', $dto->filter->userIds);
        }

        if ($dto->filter->link) {
            $qb->andWhere('u.link = :link')
                ->setParameter('link', $dto->filter->link);
        }

        if ($dto->filter->signId) {
            $qb->leftJoin('u.signs', 's')
                ->andWhere('s.id = :signId')
                ->setParameter('signId', $dto->filter->signId);
        }

        $this->order($dto->sort, $qb, 'u');

        return new OffsetPaginator()->paginate($qb, Window::fromPageNumberAndSize($dto->page, $dto->limit));
    }
}
