<?php

namespace App\Repository;

use App\Entity\Page;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Uid\Uuid;

class PageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Page::class);
    }

    final public function save(Page $page): void
    {
        $em = $this->getEntityManager();
        $em->persist($page);
        $em->flush();
    }

    final public function findById(Uuid $pageId): ?Page
    {
        /** @var ?Page $page */
        $page = $this->find($pageId);

        return $page;
    }
}
