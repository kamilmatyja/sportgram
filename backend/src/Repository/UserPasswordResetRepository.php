<?php

namespace App\Repository;

use App\Entity\{UserPasswordReset};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class UserPasswordResetRepository extends BaseRepository
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

    final public function delete(UserPasswordReset $userPasswordReset): void
    {
        $em = $this->getEntityManager();
        $em->remove($userPasswordReset);
        $em->flush();
    }

    final public function findById(Uuid $userPasswordResetId): UserPasswordReset
    {
        /** @var ?UserPasswordReset $userPasswordReset */
        $userPasswordReset = $this->findOrFail($userPasswordResetId);

        return $userPasswordReset;
    }

    final public function findLastByUserId(Uuid $userId): ?UserPasswordReset
    {
        /** @var ?UserPasswordReset $userPasswordReset */
        $userPasswordReset = $this->findOneBy(['user' => $userId], ['created_at' => 'DESC']);

        return $userPasswordReset;
    }
}
