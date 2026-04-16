<?php

namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

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

    final public function findById(string $id): ?User
    {
        /** @var ?User $user */
        $user = $this->find($id);

        return $user;
    }

    final public function findByEmail(string $email): ?User
    {
        /** @var ?User $user */
        $user = $this->findOneBy(['email' => $email, 'deleted_at' => null], ['created_at' => 'DESC']);

        return $user;
    }
}
