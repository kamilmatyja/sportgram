<?php

namespace App\Repository;

use App\Entity\PageFollow;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

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

    final public function findById(Uuid $pageFollowId): ?PageFollow
    {
        /** @var ?PageFollow $pageFollow */
        $pageFollow = $this->find($pageFollowId);

        return $pageFollow;
    }
}
