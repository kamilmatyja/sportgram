<?php

namespace App\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
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

    final protected function order(string $sort, QueryBuilder $qb, string $alias): void
    {
        [$field, $direction] = array_pad(explode(':', $sort), 2, 'asc');
        $qb->orderBy($alias . '."' . $field . '"', $direction === 'desc' ? 'DESC' : 'ASC');
    }
}
