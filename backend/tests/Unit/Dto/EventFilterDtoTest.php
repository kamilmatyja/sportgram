<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EventFilterDto;
use App\Enum\ElementStatusEnum;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class EventFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EventFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->pageId);
        $this->assertNull($dto->link);
        $this->assertNull($dto->title);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    final public function testFullyPopulatedDtoIsValid(): void
    {
        $dto = new EventFilterDto();
        $dto->userId = Uuid::v4();
        $dto->pageId = Uuid::v4();
        $dto->link = 'my-link';
        $dto->title = 'Event title';
        $dto->status = ElementStatusEnum::Active;

        $this->assertValid($dto);
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, string $value): void
    {
        $dto = new EventFilterDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'link min' => ['link', 'a'];
        yield 'link max' => ['link', str_repeat('a', 64)];
        yield 'title min' => ['title', 'a'];
        yield 'title max' => ['title', str_repeat('a', 2048)];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = new EventFilterDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'link empty' => ['link', ''];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'title empty' => ['title', ''];
        yield 'title too long' => ['title', str_repeat('a', 2049)];
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsEveryStatus(ElementStatusEnum $status): void
    {
        $dto = new EventFilterDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (ElementStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }
}
