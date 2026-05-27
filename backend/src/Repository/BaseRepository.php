<?php

namespace App\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Uid\Uuid;

abstract class BaseRepository extends ServiceEntityRepository
{
    final public function findOrFail(Uuid $id): object
    {
        $entity = $this->find($id);

        if (! $entity) {
            throw new NotFoundHttpException('Element not found.');
        }

        return $entity;
    }
}
