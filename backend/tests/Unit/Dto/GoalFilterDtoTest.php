<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\GoalFilterDto;
use App\Enum\{DisciplineEnum, GoalStatusEnum};
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class GoalFilterDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new GoalFilterDto();

        $this->assertNull($dto->userId);
        $this->assertNull($dto->link);
        $this->assertNull($dto->text);
        $this->assertNull($dto->discipline);
        $this->assertNull($dto->distance);
        $this->assertNull($dto->time);
        $this->assertNull($dto->status);
        $this->assertValid($dto);
    }

    final public function testFilledFilterIsValid(): void
    {
        $dto = new GoalFilterDto();
        $dto->userId = Uuid::v7();
        $dto->link = str_repeat('a', 64);
        $dto->text = str_repeat('a', 2048);
        $dto->discipline = DisciplineEnum::Running;
        $dto->distance = 100;
        $dto->time = 60;
        $dto->status = GoalStatusEnum::Active;

        $this->assertValid($dto);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(GoalStatusEnum $status): void
    {
        $dto = new GoalFilterDto();
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (GoalStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('disciplineProvider')]
    final public function testAcceptsDiscipline(DisciplineEnum $discipline): void
    {
        $dto = new GoalFilterDto();
        $dto->discipline = $discipline;

        $this->assertValid($dto);
    }

    public static function disciplineProvider(): iterable
    {
        foreach (DisciplineEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, string $value): void
    {
        $dto = new GoalFilterDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'empty link' => ['link', ''];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'empty text' => ['text', ''];
        yield 'text too long' => ['text', str_repeat('a', 2049)];
    }
}
