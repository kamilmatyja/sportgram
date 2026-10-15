<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EntryFilterDto;
use App\Enum\EntryTypeEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class EntryFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EntryFilterDto();

        $this->assertNull($dto->userId);
        $this->assertSame([], $dto->entityIds);
        $this->assertNull($dto->type);
        $this->assertValid($dto);
    }

    final public function testFullyFilledIsValid(): void
    {
        $dto = new EntryFilterDto();
        $dto->userId = Uuid::v7();
        $dto->addEntityId(Uuid::v7());
        $dto->addEntityId(Uuid::v7());
        $dto->type = EntryTypeEnum::Goal;

        $this->assertValid($dto);
    }

    final public function testAddEntityIdAppends(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = new EntryFilterDto();
        $dto->addEntityId($first);
        $dto->addEntityId($second);

        $this->assertSame([$first, $second], $dto->entityIds);
    }

    #[DataProvider('typeProvider')]
    final public function testAcceptsType(EntryTypeEnum $type): void
    {
        $dto = new EntryFilterDto();
        $dto->type = $type;

        $this->assertValid($dto);
    }

    public static function typeProvider(): iterable
    {
        foreach (EntryTypeEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('invalidEntityIdProvider')]
    final public function testRejectsInvalidEntityId(mixed $entityId): void
    {
        $dto = new EntryFilterDto();
        $dto->entityIds = [Uuid::v7(), $entityId];

        $this->assertOnlyViolation($dto, 'entityIds[1]');
    }

    public static function invalidEntityIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'null' => [null];
        yield 'not uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedEntityIds(): void
    {
        $id = Uuid::v7();
        $dto = new EntryFilterDto();
        $dto->entityIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'entityIds');
    }
}
