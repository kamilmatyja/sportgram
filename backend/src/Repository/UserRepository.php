<?php

namespace App\Repository;

use App\Dto\UserIndexDto;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class UserRepository extends ServiceEntityRepository
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

    final public function findById(Uuid $userId): ?User
    {
        /** @var ?User $user */
        $user = $this->find($userId);

        return $user;
    }

    final public function findWithDisciplines(Uuid $userId): ?User
    {
        return $this->createQueryBuilder('u')
            ->leftJoin('u.disciplines', 'd')
            ->addSelect('d')
            ->where('u.id = :id')
            ->setParameter('id', $userId)
            ->getQuery()
            ->getOneOrNullResult();
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
            $qb->andWhere('u.firstName LIKE :firstName')
                ->setParameter('firstName', '%' . $dto->filter->firstName . '%');
        }

        if ($dto->filter->lastName) {
            $qb->andWhere('u.lastName LIKE :lastName')
                ->setParameter('lastName', '%' . $dto->filter->lastName . '%');
        }

        if ($dto->filter->gender !== null) {
            $qb->andWhere('u.gender = :gender')
                ->setParameter('gender', $dto->filter->gender);
        }

        if ($dto->filter->country !== null) {
            $qb->andWhere('u.country = :country')
                ->setParameter('country', $dto->filter->country);
        }

        if ($dto->sort) {
            [$field, $direction] = array_pad(explode(':', $dto->sort), 2, 'asc');
            $qb->orderBy('u.' . $field, strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC');
        }

        $qb->setFirstResult(($dto->page - 1) * $dto->limit)
            ->setMaxResults($dto->limit);

        return $qb->getQuery()->getResult();
    }
}
