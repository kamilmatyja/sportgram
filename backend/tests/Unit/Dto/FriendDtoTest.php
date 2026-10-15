<?php

declare(strict_types=1);

namespace Tests\Unit\Dto;

use App\Dto\FriendDto;
use App\Validator\EntityExistsFieldValidator;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\{Constraint, ConstraintValidator};

class FriendDtoTest extends DtoTestCase
{
    final public function testEmptyDtoRequiresUserId(): void
    {
        $this->assertViolations(new FriendDto(), ['userId']);
    }

    final public function testValidDto(): void
    {
        $uuid = Uuid::v7();
        $dto = new FriendDto();
        $dto->userId = $uuid;

        $this->assertSame($uuid, $dto->userId);
        $this->assertValid($dto);
    }

    final public function testRejectsNonExistingUser(): void
    {
        $this->useConstraintValidator(EntityExistsFieldValidator::class, new class () extends ConstraintValidator {
            public function validate(mixed $value, Constraint $constraint): void
            {
                $this->context->buildViolation('missing')->addViolation();
            }
        });
        $dto = new FriendDto();
        $dto->userId = Uuid::v7();

        $this->assertOnlyViolation($dto, 'userId');
    }
}
