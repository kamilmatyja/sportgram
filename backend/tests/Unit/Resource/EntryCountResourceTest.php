<?php

declare(strict_types=1);

namespace Tests\Unit\Resource;

use App\Dto\EntryCountDto;
use App\Enum\EntryTypeEnum;
use App\Resource\EntryCountResource;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class EntryCountResourceTest extends ResourceTestCase
{
    #[DataProvider('typeProvider')]
    final public function testMapsAllFields(EntryTypeEnum $type, int $count): void
    {
        $entry = new EntryCountDto(Uuid::v7(), $type, $count);

        $data = EntryCountResource::fromEntity($entry);

        $this->assertSame([
            'entityId' => $entry->entityId,
            'type' => $type,
            'count' => $count,
        ], $data);
        $this->assertMatchesSchema(EntryCountResource::class, $data);
    }

    public static function typeProvider(): iterable
    {
        yield 'feed' => [EntryTypeEnum::Feed, 3];
        yield 'zero count' => [EntryTypeEnum::User, 0];
        yield 'training' => [EntryTypeEnum::Training, 2137];
    }

    final public function testMapsCollectionInOrder(): void
    {
        $entries = [
            new EntryCountDto(Uuid::v7(), EntryTypeEnum::Story, 1),
            new EntryCountDto(Uuid::v7(), EntryTypeEnum::Goal, 2),
        ];

        $data = EntryCountResource::fromEntityCollection($entries);

        $this->assertSame(
            [EntryCountResource::fromEntity($entries[0]), EntryCountResource::fromEntity($entries[1])],
            $data,
        );
        $this->assertSame([], EntryCountResource::fromEntityCollection([]));
    }
}
