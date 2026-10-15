<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Validator\{EntryEntityExists, EntryEntityExistsValidator};
use Attribute;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class EntryEntityExistsTest extends TestCase
{
    final public function testDefaults(): void
    {
        $constraint = new EntryEntityExists();

        $this->assertSame('Entity for type {{ type }} and id {{ entityId }} does not exist.', $constraint->message);
        $this->assertSame(EntryEntityExistsValidator::class, $constraint->validatedBy());
    }

    final public function testIsRepeatableMethodAttribute(): void
    {
        $attribute = new ReflectionClass(EntryEntityExists::class)->getAttributes(Attribute::class)[0]->newInstance();

        $this->assertSame(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE, $attribute->flags);
    }
}
