<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Entity\User;
use App\Validator\{EntityExistsField, EntityExistsFieldValidator};
use Attribute;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class EntityExistsFieldTest extends TestCase
{
    final public function testDefaults(): void
    {
        $constraint = new EntityExistsField(entity: User::class);

        $this->assertSame(User::class, $constraint->entity);
        $this->assertSame('{{ entity }} not found.', $constraint->message);
        $this->assertSame(['Default'], $constraint->groups);
        $this->assertSame(EntityExistsFieldValidator::class, $constraint->validatedBy());
    }

    final public function testAcceptsCustomMessageGroupsAndPayload(): void
    {
        $constraint = new EntityExistsField(User::class, 'No such user.', ['create'], 'payload');

        $this->assertSame('No such user.', $constraint->message);
        $this->assertSame(['create'], $constraint->groups);
        $this->assertSame('payload', $constraint->payload);
    }

    final public function testEmptyMessageKeepsDefault(): void
    {
        $this->assertSame('{{ entity }} not found.', new EntityExistsField(User::class, '')->message);
    }

    final public function testIsRepeatablePropertyAttribute(): void
    {
        $attribute = new ReflectionClass(EntityExistsField::class)->getAttributes(Attribute::class)[0]->newInstance();

        $this->assertSame(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE, $attribute->flags);
    }
}
