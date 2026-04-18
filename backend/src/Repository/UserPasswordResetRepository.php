<?php

namespace App\Repository;

use App\Entity\{UserPasswordReset};
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class UserPasswordResetRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserPasswordReset::class);
    }

    final public function save(UserPasswordReset $userPasswordReset): void
    {
        $em = $this->getEntityManager();
        $em->persist($userPasswordReset);
        $em->flush();
    }

    final public function findById(Uuid $userPasswordResetId): ?UserPasswordReset
    {
        /** @var ?UserPasswordReset $userPasswordReset */
        $userPasswordReset = $this->find($userPasswordResetId);

        return $userPasswordReset;
    }

    final public function findLastByUserId(Uuid $userId): ?UserPasswordReset
    {
        /** @var ?UserPasswordReset $userPasswordReset */
        $userPasswordReset = $this->findOneBy(['user' => $userId], ['created_at' => 'DESC']);

        return $userPasswordReset;
    }
}
