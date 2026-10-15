<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Dto\EntryDto;
use App\Enum\EntryTypeEnum;
use App\Repository\{ConversationRepository,
    EventRepository,
    FeedRepository,
    GoalRepository,
    PageRepository,
    StoryRepository,
    TrainingRepository,
    UserRepository};
use App\Validator\{EntryEntityExists, EntryEntityExistsValidator};
use Doctrine\ORM\EntityNotFoundException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Exception\{UnexpectedTypeException, UnexpectedValueException};
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/** @extends ConstraintValidatorTestCase<EntryEntityExistsValidator> */
class EntryEntityExistsValidatorTest extends ConstraintValidatorTestCase
{
    private const array REPOSITORIES = [
        'User' => UserRepository::class,
        'Story' => StoryRepository::class,
        'Conversation' => ConversationRepository::class,
        'Feed' => FeedRepository::class,
        'Goal' => GoalRepository::class,
        'Page' => PageRepository::class,
        'Event' => EventRepository::class,
        'Training' => TrainingRepository::class,
    ];

    /** @var array<string, MockObject> */
    private array $repositories = [];

    protected function setUp(): void
    {
        foreach (self::REPOSITORIES as $type => $class) {
            $this->repositories[$type] = $this->createMock($class);
        }

        parent::setUp();
    }

    protected function createValidator(): EntryEntityExistsValidator
    {
        return new EntryEntityExistsValidator(...array_values($this->repositories));
    }

    #[DataProvider('typeProvider')]
    final public function testLooksUpEntityInRepositoryMatchingType(EntryTypeEnum $type): void
    {
        $dto = $this->dto($type);
        $this->expectLookupOnlyIn($type, $dto->entityId);

        $this->validator->validate($dto, new EntryEntityExists());

        $this->assertNoViolation();
    }

    #[DataProvider('typeProvider')]
    final public function testRejectsMissingEntity(EntryTypeEnum $type): void
    {
        $dto = $this->dto($type);
        $this->expectLookupOnlyIn($type, $dto->entityId, new EntityNotFoundException());

        $this->validator->validate($dto, new EntryEntityExists());

        $this->buildViolation('Entity for type {{ type }} and id {{ entityId }} does not exist.')
            ->setParameter('{{ entityId }}', (string) $dto->entityId)
            ->setParameter('{{ type }}', (string) $type->value)
            ->assertRaised();
    }

    public static function typeProvider(): iterable
    {
        foreach (EntryTypeEnum::cases() as $type) {
            yield $type->name => [$type];
        }
    }

    final public function testCoversEveryEntryType(): void
    {
        $this->assertSame(
            array_map(static fn (EntryTypeEnum $type): string => $type->name, EntryTypeEnum::cases()),
            array_keys(self::REPOSITORIES),
        );
        $this->expectNoLookups();
    }

    #[DataProvider('incompleteDtoProvider')]
    final public function testSkipsIncompleteDto(?Uuid $entityId, ?EntryTypeEnum $type): void
    {
        $dto = new EntryDto();
        $dto->entityId = $entityId;
        $dto->type = $type;
        $this->expectNoLookups();

        $this->validator->validate($dto, new EntryEntityExists());

        $this->assertNoViolation();
    }

    public static function incompleteDtoProvider(): iterable
    {
        yield 'nothing set' => [null, null];
        yield 'missing type' => [Uuid::v7(), null];
        yield 'missing entity id' => [null, EntryTypeEnum::Feed];
    }

    final public function testRejectsValueOtherThanEntryDto(): void
    {
        $this->expectNoLookups();
        $this->expectException(UnexpectedValueException::class);

        $this->validator->validate(new stdClass(), new EntryEntityExists());
    }

    final public function testRejectsForeignConstraint(): void
    {
        $this->expectNoLookups();
        $this->expectException(UnexpectedTypeException::class);

        $this->validator->validate($this->dto(EntryTypeEnum::Feed), new NotBlank());
    }

    private function dto(EntryTypeEnum $type): EntryDto
    {
        $dto = new EntryDto();
        $dto->entityId = Uuid::v7();
        $dto->type = $type;

        return $dto;
    }

    private function expectLookupOnlyIn(EntryTypeEnum $type, Uuid $entityId, ?EntityNotFoundException $exception = null): void
    {
        foreach ($this->repositories as $name => $repository) {
            if ($name !== $type->name) {
                $repository->expects($this->never())->method('findById');

                continue;
            }

            $lookup = $repository->expects($this->once())->method('findById')->with($entityId);

            if ($exception) {
                $lookup->willThrowException($exception);
            }
        }
    }

    private function expectNoLookups(): void
    {
        foreach ($this->repositories as $repository) {
            $repository->expects($this->never())->method('findById');
        }
    }
}
