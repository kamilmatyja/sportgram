<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Entity\User;
use App\Validator\{UniqueField, UniqueFieldValidator};
use Attribute;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class UniqueFieldTest extends TestCase
{
    final public function testDefaults(): void
    {
        $constraint = new UniqueField(entity: User::class, field: 'email');

        $this->assertSame(User::class, $constraint->entity);
        $this->assertSame('email', $constraint->field);
        $this->assertSame('This value is already used.', $constraint->message);
        $this->assertSame(['Default'], $constraint->groups);
        $this->assertSame(UniqueFieldValidator::class, $constraint->validatedBy());
    }

    final public function testAcceptsCustomMessageGroupsAndPayload(): void
    {
        $constraint = new UniqueField(User::class, 'email', 'Email taken.', ['create'], 'payload');

        $this->assertSame('Email taken.', $constraint->message);
        $this->assertSame(['create'], $constraint->groups);
        $this->assertSame('payload', $constraint->payload);
    }

    final public function testEmptyMessageKeepsDefault(): void
    {
        $this->assertSame('This value is already used.', new UniqueField(User::class, 'email', '')->message);
    }

    final public function testIsRepeatablePropertyAttribute(): void
    {
        $attribute = new ReflectionClass(UniqueField::class)->getAttributes(Attribute::class)[0]->newInstance();

        $this->assertSame(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE, $attribute->flags);
    }
}
