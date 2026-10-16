<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\{TrainingDisciplineDistanceDto, TrainingDisciplineDto, TrainingDisciplineSubDistanceDto, TrainingDto};
use App\Enum\DisciplineEnum;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;

class TrainingDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new TrainingDto();

        $this->assertSame([], $dto->disciplines);
        $this->assertSame([], $dto->userIds);
    }

    final public function testEmptyDtoRequiresMandatoryFields(): void
    {
        $this->assertViolations(new TrainingDto(), [
            'startedAt',
            'endedAt',
            'title',
            'description',
            'link',
            'location',
        ]);
    }

    final public function testValid(): void
    {
        $this->assertValid($this->validDto());
    }

    final public function testFullyFilledIsValid(): void
    {
        $subDistance = new TrainingDisciplineSubDistanceDto();
        $subDistance->subDistance = 500;
        $subDistance->time = 120;
        $subDistance->lat = 52;
        $subDistance->lng = 21;
        $distance = new TrainingDisciplineDistanceDto();
        $distance->distance = 1000;
        $distance->time = 240;
        $distance->addSubDistance($subDistance);
        $discipline = new TrainingDisciplineDto();
        $discipline->discipline = DisciplineEnum::Cycling;
        $discipline->addDistance($distance);
        $dto = $this->validDto();
        $dto->addDiscipline($discipline);
        $dto->addUserId(Uuid::v4());

        $this->assertValid($dto);
    }

    final public function testAddMethodsAppend(): void
    {
        $firstDiscipline = new TrainingDisciplineDto();
        $secondDiscipline = new TrainingDisciplineDto();
        $firstUserId = Uuid::v4();
        $secondUserId = Uuid::v4();
        $dto = new TrainingDto();
        $dto->addDiscipline($firstDiscipline);
        $dto->addDiscipline($secondDiscipline);
        $dto->addUserId($firstUserId);
        $dto->addUserId($secondUserId);

        $this->assertSame([$firstDiscipline, $secondDiscipline], $dto->disciplines);
        $this->assertSame([$firstUserId, $secondUserId], $dto->userIds);
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
        yield 'title min' => ['title', 'a'];
        yield 'title max' => ['title', str_repeat('a', 256)];
        yield 'description min' => ['description', 'a'];
        yield 'description max' => ['description', str_repeat('a', 2048)];
        yield 'link min' => ['link', 'abcde'];
        yield 'link max' => ['link', str_repeat('a', 64)];
        yield 'location min' => ['location', 'abcde'];
        yield 'location max' => ['location', str_repeat('a', 1024)];
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
        yield 'title empty' => ['title', ''];
        yield 'title too long' => ['title', str_repeat('a', 257)];
        yield 'description empty' => ['description', ''];
        yield 'description too long' => ['description', str_repeat('a', 2049)];
        yield 'link empty' => ['link', ''];
        yield 'link too short' => ['link', 'abcd'];
        yield 'link too long' => ['link', str_repeat('a', 65)];
        yield 'link with invalid characters' => ['link', 'my training'];
        yield 'location empty' => ['location', ''];
        yield 'location too short' => ['location', 'abcd'];
        yield 'location too long' => ['location', str_repeat('a', 1025)];
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = $this->validDto();
        $dto->userIds = [Uuid::v4(), $userId];

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'not uuid' => ['not-a-uuid'];
    }

    final public function testRejectsDuplicatedUserIds(): void
    {
        $id = Uuid::v4();
        $dto = $this->validDto();
        $dto->userIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'userIds');
    }

    final public function testValidatesNestedDiscipline(): void
    {
        $dto = $this->validDto();
        $dto->addDiscipline(new TrainingDisciplineDto());

        $this->assertOnlyViolation($dto, 'disciplines[0].discipline');
    }

    final public function testValidatesNestedDistance(): void
    {
        $discipline = new TrainingDisciplineDto();
        $discipline->discipline = DisciplineEnum::Running;
        $discipline->addDistance(new TrainingDisciplineDistanceDto());
        $dto = $this->validDto();
        $dto->addDiscipline($discipline);

        $this->assertViolations($dto, [
            'disciplines[0].distances[0].distance',
            'disciplines[0].distances[0].time',
        ]);
    }

    final public function testValidatesNestedSubDistance(): void
    {
        $distance = new TrainingDisciplineDistanceDto();
        $distance->distance = 1000;
        $distance->time = 240;
        $distance->addSubDistance(new TrainingDisciplineSubDistanceDto());
        $discipline = new TrainingDisciplineDto();
        $discipline->discipline = DisciplineEnum::Running;
        $discipline->addDistance($distance);
        $dto = $this->validDto();
        $dto->addDiscipline($discipline);

        $this->assertViolations($dto, [
            'disciplines[0].distances[0].subDistances[0].subDistance',
            'disciplines[0].distances[0].subDistances[0].time',
        ]);
    }

    private function validDto(): TrainingDto
    {
        $dto = new TrainingDto();
        $dto->startedAt = new DateTimeImmutable('2000-01-01 10:00');
        $dto->endedAt = new DateTimeImmutable('2000-01-01 12:00');
        $dto->title = 'Morning run';
        $dto->description = 'Easy pace';
        $dto->link = 'morning-run';
        $dto->location = 'Warsaw';

        return $dto;
    }
}
