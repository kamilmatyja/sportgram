<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EntryCountFilterDto;
use App\Enum\EntryTypeEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class EntryCountFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EntryCountFilterDto();

        $this->assertSame([], $dto->entityIds);
        $this->assertNull($dto->type);
        $this->assertValid($dto);
    }

    final public function testAddEntityIdAppendsItems(): void
    {
        $first = Uuid::v4();
        $second = Uuid::v4();
        $dto = new EntryCountFilterDto();
        $dto->addEntityId($first);
        $dto->addEntityId($second);

        $this->assertSame([$first, $second], $dto->entityIds);
        $this->assertValid($dto);
    }

    #[DataProvider('typeProvider')]
    final public function testAcceptsType(EntryTypeEnum $type): void
    {
        $dto = new EntryCountFilterDto();
        $dto->type = $type;

        $this->assertValid($dto);
    }

    public static function typeProvider(): iterable
    {
        foreach (EntryTypeEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    final public function testAcceptsUuidStrings(): void
    {
        $dto = new EntryCountFilterDto();
        $dto->entityIds = [Uuid::v4()->toRfc4122()];

        $this->assertValid($dto);
    }

    #[DataProvider('invalidEntityIdsProvider')]
    final public function testRejectsInvalidEntityIds(array $entityIds, string $path): void
    {
        $dto = new EntryCountFilterDto();
        $dto->entityIds = $entityIds;

        $this->assertOnlyViolation($dto, $path);
    }

    public static function invalidEntityIdsProvider(): iterable
    {
        yield 'invalid uuid' => [['not-a-uuid'], 'entityIds[0]'];
        yield 'blank item' => [[Uuid::v4(), ''], 'entityIds[1]'];
        yield 'null item' => [[null], 'entityIds[0]'];
    }

    final public function testRejectsDuplicatedEntityIds(): void
    {
        $entityId = Uuid::v4();
        $dto = new EntryCountFilterDto();
        $dto->addEntityId($entityId);
        $dto->addEntityId($entityId);

        $this->assertOnlyViolation($dto, 'entityIds');
    }
}
