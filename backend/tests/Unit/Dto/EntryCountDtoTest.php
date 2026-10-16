<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EntryCountDto;
use App\Enum\EntryTypeEnum;
use Error;
use Symfony\Component\Uid\Uuid;

class EntryCountDtoTest extends DtoTestCase
{
    final public function testStoresValues(): void
    {
        $entityId = Uuid::v4();
        $dto = new EntryCountDto($entityId, EntryTypeEnum::Feed, 5);

        $this->assertSame($entityId, $dto->entityId);
        $this->assertSame(EntryTypeEnum::Feed, $dto->type);
        $this->assertSame(5, $dto->count);
    }

    final public function testIsReadonly(): void
    {
        $dto = new EntryCountDto(Uuid::v4(), EntryTypeEnum::Feed, 5);

        $this->expectException(Error::class);

        $dto->count = 6;
    }
}
