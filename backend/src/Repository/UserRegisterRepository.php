<?php

namespace App\Repository;

use App\Entity\UserRegister;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserRegisterRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserRegister::class);
    }

    final public function add(UserRegister $userRegister): void
    {
        $em = $this->getEntityManager();
        $em->persist($userRegister);
        $em->flush();
    }
}

