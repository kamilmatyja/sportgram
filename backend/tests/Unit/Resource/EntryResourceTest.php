<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Entity\Entry;
use App\Resource\EntryResource;
use Tests\Factory\{EntryFactory, UserFactory};

class EntryResourceTest extends ResourceTestCase
{
    final public function testMapsAllFields(): void
    {
        $entry = $this->entry();

        $data = EntryResource::fromEntity($entry);

        $this->assertSame([
            'id' => $entry->id,
            'userId' => $entry->user->id,
            'entityId' => $entry->entityId,
            'createdAt' => self::formatDate($entry->createdAt),
            'updatedAt' => self::formatDate($entry->updatedAt),
            'type' => $entry->type,
        ], $data);
        $this->assertMatchesSchema(EntryResource::class, $data);
    }

    final public function testMapsCollectionInOrder(): void
    {
        $entries = [$this->entry(), $this->entry()];

        $data = EntryResource::fromEntityCollection($entries);

        $this->assertSame([EntryResource::fromEntity($entries[0]), EntryResource::fromEntity($entries[1])], $data);
        $this->assertSame([], EntryResource::fromEntityCollection([]));
    }

    private function entry(): Entry
    {
        return self::persisted(EntryFactory::make(['user' => self::persisted(UserFactory::make())]));
    }
}
