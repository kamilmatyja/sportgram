<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FriendFilterDto;
use App\Enum\FriendStatusEnum;
use App\Validator\EntityExistsFieldValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};

class FriendFilterDtoTest extends DtoTestCase
{
    private const string MISSING_USER_ID = '01900000-0000-7000-8000-000000000000';

    protected function constraintValidators(): array
    {
        return [
            EntityExistsFieldValidator::class => new class (self::MISSING_USER_ID) extends ConstraintValidator {
                public function __construct(private readonly string $missingId)
                {
                }

                public function validate(mixed $value, Constraint $constraint): void
                {
                    if ((string) $value === $this->missingId) {
                        $this->context->buildViolation('Entity does not exist.')->addViolation();
                    }
                }
            },
        ];
    }

    final public function testDefaults(): void
    {
        $dto = new FriendFilterDto();

        $this->assertSame([], $dto->userIds);
        $this->assertNull($dto->status);
    }

    final public function testRequiresUserIds(): void
    {
        $this->assertViolations(new FriendFilterDto(), ['userIds']);
    }

    final public function testValidWithUserIds(): void
    {
        $dto = new FriendFilterDto();
        $dto->addUserId(Uuid::v7());
        $dto->addUserId(Uuid::v7());

        $this->assertValid($dto);
    }

    final public function testAddUserIdAppends(): void
    {
        $first = Uuid::v7();
        $second = Uuid::v7();
        $dto = new FriendFilterDto();
        $dto->addUserId($first);
        $dto->addUserId($second);

        $this->assertSame([$first, $second], $dto->userIds);
    }

    #[DataProvider('statusProvider')]
    final public function testAcceptsStatus(FriendStatusEnum $status): void
    {
        $dto = new FriendFilterDto();
        $dto->addUserId(Uuid::v7());
        $dto->status = $status;

        $this->assertValid($dto);
    }

    public static function statusProvider(): iterable
    {
        foreach (FriendStatusEnum::cases() as $case) {
            yield $case->name => [$case];
        }
    }

    #[DataProvider('invalidUserIdProvider')]
    final public function testRejectsInvalidUserId(mixed $userId): void
    {
        $dto = new FriendFilterDto();
        $dto->userIds = [Uuid::v7(), $userId];

        $this->assertOnlyViolation($dto, 'userIds[1]');
    }

    public static function invalidUserIdProvider(): iterable
    {
        yield 'empty' => [''];
        yield 'null' => [null];
        yield 'not uuid' => ['not-a-uuid'];
        yield 'not existing user' => [Uuid::fromString(self::MISSING_USER_ID)];
    }

    final public function testRejectsDuplicatedUserIds(): void
    {
        $id = Uuid::v7();
        $dto = new FriendFilterDto();
        $dto->userIds = [$id, $id];

        $this->assertOnlyViolation($dto, 'userIds');
    }
}
