<?php

namespace App\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\EntityNotFoundException;
use Symfony\Component\Uid\Uuid;

abstract class BaseRepository extends ServiceEntityRepository
{
    final public function findOrFail(Uuid $id): object
    {
        $entity = $this->find($id);

        if (! $entity) {
            throw new EntityNotFoundException(static::class . ' not found.');
        }

        return $entity;
    }
}
