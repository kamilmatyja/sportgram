<?php

namespace App\Repository;

use App\Dto\UserIndexDto;
use App\Entity\User;
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

    final public function findById(Uuid $userId): User
    {
        /** @var ?User $user */
        $user = $this->findOrFail($userId);

        return $user;
    }

    final public function findByEmail(string $email): ?User
    {
        /** @var ?User $user */
        $user = $this->findOneBy(['email' => $email], ['created_at' => 'DESC']);

        return $user;
    }

    final public function findUsers(UserIndexDto $dto): array
    {
        $qb = $this->createQueryBuilder('u');

        if ($dto->filter->firstName) {
            $qb->andWhere('u.first_name LIKE :firstName')
                ->setParameter('firstName', '%' . $dto->filter->firstName . '%');
        }

        if ($dto->filter->lastName) {
            $qb->andWhere('u.last_name LIKE :lastName')
                ->setParameter('lastName', '%' . $dto->filter->lastName . '%');
        }

        if ($dto->filter->gender) {
            $qb->andWhere('u.gender = :gender')
                ->setParameter('gender', $dto->filter->gender);
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

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $dbField = $this->camelCaseToSnakeCase($field);
            $qb->orderBy('u.' . $dbField, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }

    private function camelCaseToSnakeCase(string $input): string
    {
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $input));
    }
}
