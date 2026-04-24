<?php

namespace App\Repository;

use App\Entity\UserRole;
use Doctrine\Persistence\ManagerRegistry;

class UserRoleRepository extends BaseRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserRole::class);
    }

    final public function save(UserRole $userRole): void
    {
        $em = $this->getEntityManager();
        $em->persist($userRole);
        $em->flush();
    }

    final public function delete(UserRole $userRole): void
    {
        $em = $this->getEntityManager();
        $em->remove($userRole);
        $em->flush();
    }
}
