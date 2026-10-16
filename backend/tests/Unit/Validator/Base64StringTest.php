<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Validator\{Base64String, Base64StringValidator};
use Attribute;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

class Base64StringTest extends TestCase
{
    final public function testDefaults(): void
    {
        $constraint = new Base64String();

        $this->assertSame('This value should be a valid base64 string.', $constraint->message);
        $this->assertSame(Base64StringValidator::class, $constraint->validatedBy());
    }

    final public function testIsRepeatablePropertyAttribute(): void
    {
        $attribute = new ReflectionClass(Base64String::class)->getAttributes(Attribute::class)[0]->newInstance();

        $this->assertSame(Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE, $attribute->flags);
    }
}
