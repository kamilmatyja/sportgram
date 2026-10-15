<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Entity\User;
use App\Validator\{UniqueField, UniqueFieldValidator};
use Doctrine\ORM\{EntityManagerInterface, EntityRepository};
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\MockObject\MockObject;
use stdClass;
use Symfony\Component\HttpFoundation\{Request, RequestStack};
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints\NotBlank;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;
use Tests\Factory\UserFactory;

/** @extends ConstraintValidatorTestCase<UniqueFieldValidator> */
class UniqueFieldValidatorTest extends ConstraintValidatorTestCase
{
    private EntityManagerInterface&MockObject $em;

    private RequestStack $requestStack;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->requestStack = new RequestStack();

        parent::setUp();
    }

    protected function createValidator(): UniqueFieldValidator
    {
        return new UniqueFieldValidator($this->em, $this->requestStack);
    }

    final public function testAcceptsUnusedValue(): void
    {
        $this->givenFound(User::class, ['email' => 'jan@kowalski.pl'], null);

        $this->validator->validate('jan@kowalski.pl', new UniqueField(User::class, 'email'));

        $this->assertNoViolation();
    }

    final public function testRejectsUsedValue(): void
    {
        $this->givenFound(User::class, ['phone' => 123456789], $this->user());

        $this->validator->validate(123456789, new UniqueField(User::class, 'phone'));

        $this->buildViolation('This value is already used.')->assertRaised();
    }

    final public function testUsesCustomMessage(): void
    {
        $this->givenFound(User::class, ['link' => 'my-link'], $this->user());

        $this->validator->validate('my-link', new UniqueField(User::class, 'link', 'Link taken.'));

        $this->buildViolation('Link taken.')->assertRaised();
    }

    final public function testAcceptsValueOwnedByEntityBeingUpdated(): void
    {
        $user = $this->user();
        $this->givenRequestId((string) $user->id);
        $this->givenFound(User::class, ['email' => 'jan@kowalski.pl'], $user);

        $this->validator->validate('jan@kowalski.pl', new UniqueField(User::class, 'email'));

        $this->assertNoViolation();
    }

    final public function testRequestIdMayBeUuidObject(): void
    {
        $user = $this->user();
        $this->givenRequestId(Uuid::fromString((string) $user->id));
        $this->givenFound(User::class, ['email' => 'jan@kowalski.pl'], $user);

        $this->validator->validate('jan@kowalski.pl', new UniqueField(User::class, 'email'));

        $this->assertNoViolation();
    }

    final public function testRejectsValueOwnedByAnotherEntityDuringUpdate(): void
    {
        $this->givenRequestId((string) Uuid::v7());
        $this->givenFound(User::class, ['email' => 'jan@kowalski.pl'], $this->user());

        $this->validator->validate('jan@kowalski.pl', new UniqueField(User::class, 'email'));

        $this->buildViolation('This value is already used.')->assertRaised();
    }

    final public function testRejectsWhenFoundObjectHasNoIdProperty(): void
    {
        $this->givenRequestId((string) Uuid::v7());
        $this->givenFound(User::class, ['email' => 'jan@kowalski.pl'], new stdClass());

        $this->validator->validate('jan@kowalski.pl', new UniqueField(User::class, 'email'));

        $this->buildViolation('This value is already used.')->assertRaised();
    }

    #[DataProvider('emptyValueProvider')]
    final public function testIgnoresEmptyValues(?string $value): void
    {
        $this->em->expects($this->never())->method('getRepository');

        $this->validator->validate($value, new UniqueField(User::class, 'email'));

        $this->assertNoViolation();
    }

    public static function emptyValueProvider(): iterable
    {
        yield 'null' => [null];
        yield 'empty string' => [''];
    }

    final public function testRejectsForeignConstraint(): void
    {
        $this->em->expects($this->never())->method('getRepository');
        $this->expectException(UnexpectedTypeException::class);

        $this->validator->validate('value', new NotBlank());
    }

    private function givenFound(string $entity, array $criteria, ?object $found): void
    {
        $repository = $this->createMock(EntityRepository::class);
        $repository->expects($this->once())->method('findOneBy')->with($criteria)->willReturn($found);
        $this->em->expects($this->once())->method('getRepository')->with($entity)->willReturn($repository);
    }

    private function givenRequestId(string|Uuid $id): void
    {
        $request = new Request();
        $request->attributes->set('id', $id);
        $this->requestStack->push($request);
    }

    private function user(): User
    {
        $user = UserFactory::make();
        $user->id = Uuid::v7();

        return $user;
    }
}
