<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{EventDisciplineDistanceDto, EventDisciplineDto, EventDisciplineSubDistanceDto, EventDto};
use App\Enum\DisciplineEnum;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;

class EventDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresAllMandatoryFields(): void
    {
        $dto = new EventDto();

        $this->assertSame([], $dto->disciplines);
        $this->assertViolations($dto, [
            'startedAt',
            'endedAt',
            'title',
            'description',
            'link',
            'rules',
            'photo',
            'location',
        ]);
    }

    final public function testValidDto(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testBoundaryValuesAreValid(): void
    {
        $dto = $this->validDto();
        $dto->title = str_repeat('a', 256);
        $dto->description = str_repeat('a', 2048);
        $dto->link = str_repeat('a', 64);
        $dto->rules = str_repeat('a', 2048);
        $dto->location = str_repeat('a', 1024);

        $this->assertValid($dto);

        $dto->title = 'a';
        $dto->description = 'a';
        $dto->link = 'Ab-1-';
        $dto->rules = 'a';
        $dto->location = 'aaaaa';

        $this->assertValid($dto);
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
        yield 'empty title' => ['title', ''];
        yield 'title too long' => ['title', str_repeat('a', 257)];
        yield 'empty description' => ['description', ''];
        yield 'description too long' => ['description', str_repeat('a', 2049)];
        yield 'empty link' => ['link', ''];
        yield 'link too short' => ['link', 'abcd'];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'link with space' => ['link', 'my link'];
        yield 'link with underscore' => ['link', 'my_link'];
        yield 'link with diacritics' => ['link', 'zażółć'];
        yield 'empty rules' => ['rules', ''];
        yield 'rules too long' => ['rules', str_repeat('a', 2049)];
        yield 'empty photo' => ['photo', ''];
        yield 'empty location' => ['location', ''];
        yield 'location too short' => ['location', 'abcd'];
        yield 'location too long' => ['location', str_repeat('a', 1025)];
    }

    final public function testAddDisciplineAppendsItems(): void
    {
        $first = $this->discipline(DisciplineEnum::Running);
        $second = $this->discipline(DisciplineEnum::Cycling);
        $dto = $this->validDto();

        $dto->addDiscipline($first);
        $dto->addDiscipline($second);

        $this->assertSame([$first, $second], $dto->disciplines);
        $this->assertValid($dto);
    }

    final public function testValidatesNestedDisciplines(): void
    {
        $dto = $this->validDto();
        $dto->addDiscipline($this->discipline(DisciplineEnum::Running));
        $dto->addDiscipline(new EventDisciplineDto());

        $this->assertOnlyViolation($dto, 'disciplines[1].discipline');
    }

    final public function testValidatesDeeplyNestedDistances(): void
    {
        $distance = new EventDisciplineDistanceDto();
        $distance->distance = 10000;
        $distance->addSubDistance(new EventDisciplineSubDistanceDto());

        $discipline = $this->discipline(DisciplineEnum::Running);
        $discipline->addDistance(new EventDisciplineDistanceDto());
        $discipline->addDistance($distance);

        $dto = $this->validDto();
        $dto->addDiscipline($discipline);

        $this->assertViolations($dto, [
            'disciplines[0].distances[0].distance',
            'disciplines[0].distances[1].subDistances[0].subDistance',
        ]);
    }

    private function validDto(): EventDto
    {
        $dto = new EventDto();
        $dto->startedAt = new DateTimeImmutable('2030-01-01 10:00');
        $dto->endedAt = new DateTimeImmutable('2030-01-01 18:00');
        $dto->title = 'Event Title';
        $dto->description = 'Event Description';
        $dto->link = 'my-link';
        $dto->rules = 'Event Rules';
        $dto->photo = 'base64string';
        $dto->location = 'Event Location';

        return $dto;
    }

    private function discipline(DisciplineEnum $discipline): EventDisciplineDto
    {
        $dto = new EventDisciplineDto();
        $dto->discipline = $discipline;

        return $dto;
    }
}
