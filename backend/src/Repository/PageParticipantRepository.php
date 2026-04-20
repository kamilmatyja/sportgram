<?php

namespace App\Repository;

use App\Entity\PageParticipant;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PageParticipantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PageParticipant::class);
    }

    final public function save(PageParticipant $pageParticipant): void
    {
        $em = $this->getEntityManager();
        $em->persist($pageParticipant);
        $em->flush();
    }
}
