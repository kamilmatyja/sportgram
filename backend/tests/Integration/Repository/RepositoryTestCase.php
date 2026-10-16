<?php

declare(strict_types=1);

namespace Tests\Integration\Repository;

use DateTimeImmutable;
use Doctrine\DBAL\Exception;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Uid\Uuid;

abstract class RepositoryTestCase extends KernelTestCase
{
    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();
        $this->em = static::getContainer()->get('doctrine')->getManager();
    }

    /**
     * @template T of object
     * @param class-string<T> $repositoryClass
     * @return T
     */
    final protected function repository(string $repositoryClass): object
    {
        return static::getContainer()->get($repositoryClass);
    }

    /**
     * @throws Exception
     */
    final protected function truncate(string ...$tables): void
    {
        $connection = $this->em->getConnection();
        $platform = $connection->getDatabasePlatform();

        foreach ($tables as $table) {
            $connection->executeStatement($platform->getTruncateTableSQL($table, true));
        }
    }

    /**
     * @throws Exception
     */
    final protected function storeCreatedAt(object $entity, string $createdAt): void
    {
        $this->em->getConnection()->update(
            $this->em->getClassMetadata($entity::class)->getTableName(),
            ['created_at' => new DateTimeImmutable($createdAt)->format('Y-m-d H:i:s')],
            ['id' => (string) $entity->id],
        );
    }

    final protected function clear(): void
    {
        $this->em->clear();
    }

    /** @return string[] */
    final protected static function ids(iterable $entities): array
    {
        $ids = [];

        foreach ($entities as $entity) {
            $ids[] = (string) $entity->id;
        }

        return $ids;
    }

    final protected static function id(object $entity): Uuid
    {
        return Uuid::fromString((string) $entity->id);
    }
}
