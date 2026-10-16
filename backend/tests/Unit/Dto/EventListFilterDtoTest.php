<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventListFilterDto;
use App\Enum\SaveStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class EventListFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EventListFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsFilledFilter(SaveStatusEnum $status): void
    {
        $dto = new EventListFilterDto();
        $dto->userId = Uuid::v4();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (SaveStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
