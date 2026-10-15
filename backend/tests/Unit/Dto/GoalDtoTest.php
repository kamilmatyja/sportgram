<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\GoalDto;
use App\Enum\DisciplineEnum;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class GoalDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new GoalDto();

        $this->assertNull($dto->startedAt);
        $this->assertNull($dto->endedAt);
        $this->assertNull($dto->time);
        $this->assertSame([], $dto->userIds);
    }

    final public function testEmptyDtoRequiresMandatoryFields(): void
    {
        $this->assertViolations(new GoalDto(), ['text', 'link', 'discipline', 'distance']);
    }

    final public function testValid(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testFullyFilledIsValid(): void
    {
        $dto = $this->validDto();
        $dto->startedAt = new DateTimeImmutable('2000-01-01 10:00');
        $dto->endedAt = new DateTimeImmutable('2000-02-01 10:00');
        $dto->time = 60;
        $dto->addUserId(Uuid::v7());
        $dto->addUserId(Uuid::v7());

        $this->assertValid($dto);
    }

    final public function testAddUserIdAppends(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = new GoalDto();
        $dto->addUserId($first);
        $dto->addUserId($second);

        $this->assertSame([$first, $second], $dto->userIds);
    }

    #[DataProvider('disciplineProvider')]
    final public function testAcceptsDiscipline(DisciplineEnum $discipline): void
    {
        $dto = $this->validDto();
        $dto->discipline = $discipline;

        $this->assertValid($dto);
    }

    public static function disciplineProvider(): iterable
    {
        foreach (DisciplineEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('boundaryValueProvider')]
    final public function testAcceptsBoundaryValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertValid($dto);
    }

    public static function boundaryValueProvider(): iterable
    {
        yield 'text min' => ['text', 'a'];
        yield 'text max' => ['text', str_repeat('a', 2048)];
        yield 'link min' => ['link', 'abcde'];
        yield 'link max' => ['link', str_repeat('a', 64)];
        yield 'link with digits and dashes' => ['link', 'My-Goal-2000'];
    }

    #[DataProvider('invalidValueProvider')]
    final public function testRejectsInvalidValue(string $property, mixed $value): void
    {
        $dto = $this->validDto();
        $dto->{$property} = $value;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function invalidValueProvider(): iterable
    {
        yield 'text empty' => ['text', ''];
        yield 'text too long' => ['text', str_repeat('a', 2049)];
        yield 'link empty' => ['link', ''];
        yield 'link too short' => ['link', 'abcd'];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'link with space' => ['link', 'my link'];
        yield 'link with underscore' => ['link', 'my_link'];
        yield 'link with diacritics' => ['link', 'zażółć'];
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = $this->validDto();
        $dto->userIds = [Uuid::v7(), $userId];

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'not uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedUserIds(): void
    {
        $id = Uuid::v7();
        $dto = $this->validDto();
        $dto->userIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'userIds');
    }

    private function validDto(): GoalDto
    {
        $dto = new GoalDto();
        $dto->text = 'Running goal';
        $dto->link = 'my-link';
        $dto->discipline = DisciplineEnum::Running;
        $dto->distance = 100;

        return $dto;
    }
}
