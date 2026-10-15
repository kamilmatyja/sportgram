<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Validator\{EntityExistsFieldValidator, EntryEntityExistsValidator, UniqueFieldValidator};
use PHPUnit\Framework\TestCase;
use Symfony\Component\Validator\{
    Constraint,
    ConstraintValidator,
    ConstraintValidatorFactory,
    ConstraintValidatorInterface,
    ConstraintViolationListInterface,
    Validation};
use Symfony\Component\Validator\Validator\ValidatorInterface;

abstract class DtoTestCase extends TestCase
{
    private const array DATABASE_VALIDATORS = [
        UniqueFieldValidator::class,
        EntityExistsFieldValidator::class,
        EntryEntityExistsValidator::class,
    ];

    protected ValidatorInterface $validator;

    /** @var array<class-string, ConstraintValidatorInterface> */
    private array $validatorOverrides = [];

    protected function setUp(): void
    {
        $this->buildValidator();
    }

    /**
     * @return array<class-string, ConstraintValidatorInterface>
     */
    protected function constraintValidators(): array
    {
        return [];
    }

    final protected function useConstraintValidator(string $class, ConstraintValidatorInterface $validator): void
    {
        $this->validatorOverrides[$class] = $validator;
        $this->buildValidator();
    }

    final protected function validate(object $dto): ConstraintViolationListInterface
    {
        return $this->validator->validate($dto);
    }

    /** @return string[] */
    final protected function violatedPaths(object $dto): array
    {
        $paths = [];

        foreach ($this->validate($dto) as $violation) {
            $paths[] = $violation->getPropertyPath();
        }

        return array_values(array_unique($paths));
    }

    final protected function assertValid(object $dto): void
    {
        $violations = $this->validate($dto);

        $this->assertCount(0, $violations, (string) $violations);
    }

    final protected function assertViolations(object $dto, array $expectedPaths): void
    {
        $actual = $this->violatedPaths($dto);
        sort($actual);
        sort($expectedPaths);

        $this->assertSame($expectedPaths, $actual);
    }

    final protected function assertOnlyViolation(object $dto, string $expectedPath): void
    {
        $this->assertViolations($dto, [$expectedPath]);
    }

    private function buildValidator(): void
    {
        $this->validator = Validation::createValidatorBuilder()
            ->enableAttributeMapping()
            ->setConstraintValidatorFactory($this->createConstraintValidatorFactory())
            ->getValidator();
    }

    private function createConstraintValidatorFactory(): ConstraintValidatorFactory
    {
        $validators = [...$this->constraintValidators(), ...$this->validatorOverrides];

        foreach (self::DATABASE_VALIDATORS as $class) {
            $validators[$class] ??= new class () extends ConstraintValidator {
                public function validate(mixed $value, Constraint $constraint): void
                {
                }
            };
        }

        return new ConstraintValidatorFactory($validators);
    }
}
