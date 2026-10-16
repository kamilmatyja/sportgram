<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\EntryDto;
use App\Enum\EntryTypeEnum;
use App\Validator\{EntryEntityExists, EntryEntityExistsValidator};
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};

class EntryDtoTest extends DtoTestCase
{
    final public function testDefaults(): void
    {
        $dto = new EntryDto();

        $this->assertNull($dto->entityId);
        $this->assertNull($dto->type);
    }

    final public function testEmptyDtoRequiresAllFields(): void
    {
        $this->assertViolations(new EntryDto(), ['entityId', 'type']);
    }

    #[DataProvider('typeProvider')]
    final public function testAcceptsEveryType(EntryTypeEnum $type): void
    {
        $dto = $this->validDto();
        $dto->type = $type;

        $this->assertValid($dto);
    }

    public static function typeProvider(): iterable
    {
        foreach (EntryTypeEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('missingFieldProvider')]
    final public function testRejectsMissingField(string $property): void
    {
        $dto = $this->validDto();
        $dto->{$property} = null;

        $this->assertOnlyViolation($dto, $property);
    }

    public static function missingFieldProvider(): iterable
    {
        yield 'entityId' => ['entityId'];
        yield 'type' => ['type'];
    }

    final public function testEntityExistenceConstraintIsAppliedToWholeDto(): void
    {
        $validator = new class () extends ConstraintValidator {
            public ?object $validated = null;

            public function validate(mixed $value, Constraint $constraint): void
            {
                $this->validated = $value;
                $this->context->buildViolation('missing')->addViolation();
            }
        };
        $this->useConstraintValidator(EntryEntityExistsValidator::class, $validator);
        $dto = $this->validDto();

        $violations = $this->validate($dto);

        $this->assertCount(1, $violations);
        $this->assertSame('entityValidationData', $violations[0]->getPropertyPath());
        $this->assertInstanceOf(EntryEntityExists::class, $violations[0]->getConstraint());
        $this->assertSame($dto, $validator->validated);
    }

    private function validDto(): EntryDto
    {
        $dto = new EntryDto();
        $dto->entityId = Uuid::v4();
        $dto->type = EntryTypeEnum::Feed;

        return $dto;
    }
}
