<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Validator\{Base64String, Base64StringValidator};
use PHPUnit\Framework\Attributes\DataProvider;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/** @extends ConstraintValidatorTestCase<Base64StringValidator> */
class Base64StringValidatorTest extends ConstraintValidatorTestCase
{
    protected function createValidator(): Base64StringValidator
    {
        return new Base64StringValidator();
    }

    #[DataProvider('validProvider')]
    final public function testAcceptsValidBase64(?string $value): void
    {
        $this->validator->validate($value, new Base64String());

        $this->assertNoViolation();
    }

    public static function validProvider(): iterable
    {
        yield 'null' => [null];
        yield 'empty string' => [''];
        yield 'text' => [base64_encode('Sportgram')];
        yield 'binary' => [base64_encode(random_bytes(64))];
        yield 'without padding' => ['YQ'];
    }

    #[DataProvider('invalidProvider')]
    final public function testRejectsInvalidBase64(string $value): void
    {
        $this->validator->validate($value, new Base64String());

        $this->buildViolation('This value should be a valid base64 string.')->assertRaised();
    }

    public static function invalidProvider(): iterable
    {
        yield 'special characters' => ['!!!'];
        yield 'url-safe alphabet' => ['ab-_'];
        yield 'data uri prefix' => ['data:image/webp;base64,' . base64_encode('x')];
    }

    final public function testUsesConstraintMessage(): void
    {
        $constraint = new Base64String();
        $constraint->message = 'Invalid photo.';

        $this->validator->validate('!!!', $constraint);

        $this->buildViolation('Invalid photo.')->assertRaised();
    }

    final public function testRejectsForeignConstraint(): void
    {
        $this->expectException(UnexpectedTypeException::class);

        $this->validator->validate('YQ==', new NotBlank());
    }
}
