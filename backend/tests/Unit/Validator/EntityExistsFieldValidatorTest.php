<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Entity\{Page, User};
use App\Validator\{EntityExistsField, EntityExistsFieldValidator};
use Doctrine\ORM\{EntityManagerInterface, EntityRepository};
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/** @extends ConstraintValidatorTestCase<EntityExistsFieldValidator> */
class EntityExistsFieldValidatorTest extends ConstraintValidatorTestCase
{
    private EntityManagerInterface&MockObject $em;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);

        parent::setUp();
    }

    protected function createValidator(): EntityExistsFieldValidator
    {
        return new EntityExistsFieldValidator($this->em);
    }

    final public function testAcceptsExistingEntity(): void
    {
        $id = Uuid::v4();
        $this->givenRepository(User::class, $id, new stdClass());

        $this->validator->validate($id, new EntityExistsField(User::class));

        $this->assertNoViolation();
    }

    final public function testRejectsMissingEntity(): void
    {
        $id = Uuid::v4();
        $this->givenRepository(Page::class, $id, null);

        $this->validator->validate($id, new EntityExistsField(Page::class));

        $this->buildViolation('{{ entity }} not found.')
            ->setParameter('{{ entity }}', Page::class)
            ->assertRaised();
    }

    final public function testUsesCustomMessage(): void
    {
        $id = Uuid::v4();
        $this->givenRepository(User::class, $id, null);

        $this->validator->validate($id, new EntityExistsField(User::class, 'Missing {{ entity }}.'));

        $this->buildViolation('Missing {{ entity }}.')
            ->setParameter('{{ entity }}', User::class)
            ->assertRaised();
    }

    #[DataProvider('nonUuidProvider')]
    final public function testIgnoresValuesOtherThanUuid(mixed $value): void
    {
        $this->em->expects($this->never())->method('getRepository');

        $this->validator->validate($value, new EntityExistsField(User::class));

        $this->assertNoViolation();
    }

    public static function nonUuidProvider(): iterable
    {
        yield 'null' => [null];
        yield 'uuid string' => ['b1a7c8e2-1d2f-4e3a-9b2c-123456789abc'];
        yield 'integer' => [1];
    }

    final public function testRejectsForeignConstraint(): void
    {
        $this->em->expects($this->never())->method('getRepository');
        $this->expectException(UnexpectedTypeException::class);

        $this->validator->validate(Uuid::v4(), new NotBlank());
    }

    private function givenRepository(string $entity, Uuid $id, ?object $found): void
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('find')->with($id)->willReturn($found);
        $this->em->expects($this->once())->method('getRepository')->with($entity)->willReturn($repository);
    }
}
