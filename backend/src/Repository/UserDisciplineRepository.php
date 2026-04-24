<?php

namespace App\Repository;

use App\Entity\UserDiscipline;
use Doctrine\Persistence\ManagerRegistry;

class UserDisciplineRepository extends BaseRepository
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

    final public function delete(UserDiscipline $userDiscipline): void
    {
        $em = $this->getEntityManager();
        $em->remove($userDiscipline);
        $em->flush();
    }
}
