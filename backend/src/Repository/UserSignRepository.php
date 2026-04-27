<?php

namespace App\Repository;

use App\Entity\{UserSign};
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class UserSignRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserSign::class);
    }

    final public function save(UserSign $userSign): void
    {
        $em = $this->getEntityManager();
        $em->persist($userSign);
        $em->flush();
    }

    final public function delete(UserSign $userSign): void
    {
        $em = $this->getEntityManager();
        $em->remove($userSign);
        $em->flush();
    }

    final public function findById(Uuid $userSignId): UserSign
    {
        /** @var UserSign $userSign */
        $userSign = $this->findOrFail($userSignId);

        return $userSign;
    }

    final public function findLastByUserId(Uuid $userId): ?UserSign
    {
        /** @var ?UserSign $userSign */
        $userSign = $this->findOneBy(['user' => $userId], ['createdAt' => 'DESC']);

        return $userSign;
    }
}
