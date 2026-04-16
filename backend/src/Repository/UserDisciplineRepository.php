<?php

namespace App\Repository;

use App\Entity\UserDiscipline;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class UserDisciplineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserDiscipline::class);
    }

    final public function save(UserDiscipline $userDiscipline): void
    {
        $em = $this->getEntityManager();
        $em->persist($userDiscipline);
        $em->flush();
    }
}
