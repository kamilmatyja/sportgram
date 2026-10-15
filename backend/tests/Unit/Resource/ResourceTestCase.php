<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use DateTimeImmutable;
use OpenApi\Attributes\Schema;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use Symfony\Component\Uid\Uuid;

abstract class ResourceTestCase extends TestCase
{
    protected const string DATE_FORMAT = 'Y-m-d\TH:i:s';

    /**
     * @template T of object
     * @param T $entity
     * @return T
     */
    final protected static function persisted(object $entity): object
    {
        $entity->id = Uuid::v7();
        $entity->onPrePersist();

        return $entity;
    }

    final protected static function formatDate(DateTimeImmutable $date): string
    {
        return $date->format(self::DATE_FORMAT);
    }

    final protected function assertMatchesSchema(string $resourceClass, array $data): void
    {
        $attributes = new ReflectionClass($resourceClass)->getAttributes(Schema::class);
        $this->assertCount(1, $attributes, "$resourceClass has no OpenAPI schema.");

        /** @var Schema $schema */
        $schema = $attributes[0]->newInstance();
        $properties = array_map(static fn ($property): string => $property->property, $schema->properties);
        $required = is_array($schema->required) ? $schema->required : [];

        $this->assertSame([], array_values(array_diff(array_keys($data), $properties)), 'Keys missing in schema.');
        $this->assertSame([], array_values(array_diff($required, array_keys($data))), 'Required keys missing in output.');
    }
}
