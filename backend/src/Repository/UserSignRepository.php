<?php

namespace App\Repository;

use App\Entity\{UserSign};
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserSignRepository extends ServiceEntityRepository
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

    final public function findById(string $id): ?UserSign
    {
        /** @var ?UserSign $userSign */
        $userSign = $this->find($id);

        return $userSign;
    }

    final public function findLastByUserId(string $userId): ?UserSign
    {
        /** @var ?UserSign $userSign */
        $userSign = $this->findOneBy(['user' => $userId]);

        return $userSign;
    }
}
