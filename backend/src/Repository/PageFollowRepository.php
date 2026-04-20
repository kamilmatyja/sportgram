<?php

namespace App\Repository;

use App\Entity\PageFollow;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PageFollowRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageFollow::class);
    }

    final public function save(PageFollow $pageFollow): void
    {
        $em = $this->getEntityManager();
        $em->persist($pageFollow);
        $em->flush();
    }
}
