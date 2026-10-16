<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{UserEmailDto, UserPasswordDto};
use App\Entity\{User, UserPasswordReset};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Event\UserPasswordResetEmailEvent;
use App\Exception\SaveValidationException;
use App\Repository\{UserPasswordResetRepository, UserRegisterRepository, UserRepository};
use App\Service\PasswordResetService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{UserFactory, UserPasswordResetFactory, UserRegisterFactory};

#[AllowMockObjectsWithoutExpectations]
class PasswordResetServiceTest extends ServiceTestCase
{
    private UserRepository&MockObject $userRepository;

    private UserRegisterRepository&MockObject $userRegisterRepository;

    private UserPasswordResetRepository&MockObject $userPasswordResetRepository;

    private UserPasswordHasherInterface&MockObject $hasher;

    private PasswordResetService $service;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->userRegisterRepository = $this->createMock(UserRegisterRepository::class);
        $this->userPasswordResetRepository = $this->createMock(UserPasswordResetRepository::class);
        $this->hasher = $this->createMock(UserPasswordHasherInterface::class);

        $this->service = new PasswordResetService(
            $this->userRepository,
            $this->userRegisterRepository,
            $this->userPasswordResetRepository,
            $this->hasher,
            $this->dispatcher(),
        );
    }

    final public function testPasswordResetCreatesNewCodeAndSendsEmail(): void
    {
        $user = $this->acceptedUser();
        $this->userRepository->expects($this->once())->method('findByEmail')->with($user->email)->willReturn($user);
        $this->confirmedRegistration($user);
        $this->userPasswordResetRepository->expects($this->once())->method('findLastByUserId')->with($user->id)->willReturn(null);
        $saved = null;
        $this->userPasswordResetRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (UserPasswordReset $reset) use (&$saved): void {
                $saved = $reset;
                self::persist()($reset);
            });
        $this->userRepository->expects($this->never())->method('save');

        $id = $this->service->passwordReset(self::emailDto($user->email));

        $this->assertSame($saved->id, $id);
        $this->assertSame($user, $saved->user);
        $this->assertSame(0, $saved->attempt);
        $this->assertSame(UnauthorizedStatusEnum::NotSent, $saved->status);
        $this->assertGreaterThanOrEqual(100000, $saved->code);
        $this->assertLessThanOrEqual(999999, $saved->code);
        $this->assertResetEmails([[$user, $saved]]);
    }

    final public function testPasswordResetRejectsUnknownEmail(): void
    {
        $this->userRepository->expects($this->once())->method('findByEmail')->with('nobody@example.com')->willReturn(null);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertPasswordResetFails(self::emailDto('nobody@example.com'), 'User not found.');
    }

    final public function testPasswordResetRejectsBannedUser(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Banned]));
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertPasswordResetFails(self::emailDto($user->email), 'User is banned.');
    }

    /** @return iterable<string, array{?UnauthorizedStatusEnum}> */
    public static function unconfirmedRegistrationProvider(): iterable
    {
        yield 'no registration' => [null];
        yield 'not sent' => [UnauthorizedStatusEnum::NotSent];
        yield 'sent' => [UnauthorizedStatusEnum::Sent];
        yield 'incorrect' => [UnauthorizedStatusEnum::Incorrect];
    }

    #[DataProvider('unconfirmedRegistrationProvider')]
    final public function testPasswordResetRejectsUnconfirmedAccount(?UnauthorizedStatusEnum $status): void
    {
        $user = $this->acceptedUser();
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->userRegisterRepository->expects($this->once())
            ->method('findLastByUserId')
            ->with($user->id)
            ->willReturn(null === $status ? null : self::entity(UserRegisterFactory::make(['user' => $user, 'status' => $status])));
        $this->userPasswordResetRepository->expects($this->never())->method('findLastByUserId');

        $this->assertPasswordResetFails(self::emailDto($user->email), 'User account is not confirmed.');
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function lockedOutProvider(): iterable
    {
        yield 'three wrong attempts just now' => [3, UnauthorizedStatusEnum::Incorrect, '-1 minute'];
        yield 'more than three wrong attempts' => [7, UnauthorizedStatusEnum::Incorrect, '-2 hours'];
        yield 'just inside the one day lock' => [3, UnauthorizedStatusEnum::Incorrect, '-23 hours -59 minutes'];
    }

    #[DataProvider('lockedOutProvider')]
    final public function testPasswordResetRejectsWhenLatestResetIsLockedOut(int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): void
    {
        $user = $this->resettableUser();
        $this->userPasswordResetRepository->expects($this->once())
            ->method('findLastByUserId')
            ->with($user->id)
            ->willReturn($this->latestReset($user, $attempt, $status, $updatedAt));

        $this->assertPasswordResetFails(self::emailDto($user->email), 'Too many attempts.');
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function notLockedOutProvider(): iterable
    {
        yield 'two wrong attempts' => [2, UnauthorizedStatusEnum::Incorrect, '-1 minute'];
        yield 'three attempts but last one correct' => [3, UnauthorizedStatusEnum::Correct, '-1 minute'];
        yield 'three attempts, code still sent' => [3, UnauthorizedStatusEnum::Sent, '-1 minute'];
        yield 'lock expired just outside one day' => [3, UnauthorizedStatusEnum::Incorrect, '-1 day -1 minute'];
    }

    #[DataProvider('notLockedOutProvider')]
    final public function testPasswordResetAllowsWhenLatestResetIsNotLockedOut(int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): void
    {
        $user = $this->resettableUser();
        $this->userPasswordResetRepository->method('findLastByUserId')->willReturn($this->latestReset($user, $attempt, $status, $updatedAt));
        $this->userPasswordResetRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());

        $id = $this->service->passwordReset(self::emailDto($user->email));

        $this->assertCount(1, $this->dispatched);
        $this->assertSame($id, $this->dispatched[0]->getUserPasswordReset()->id);
    }

    final public function testConfirmWithCorrectCodeStoresHashedPasswordAndMarksCorrect(): void
    {
        $user = $this->acceptedUser();
        $oldPassword = $user->password;
        $reset = self::entity(UserPasswordResetFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 1,
            'status' => UnauthorizedStatusEnum::Sent,
        ]));
        $this->userPasswordResetRepository->expects($this->once())->method('findById')->with($reset->id)->willReturn($reset);
        $this->hasher->expects($this->once())->method('hashPassword')->with($user, 'n3w-Pa55')->willReturn('hashed-n3w');
        $this->userRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (User $saved): bool => $saved === $user && 'hashed-n3w' === $saved->password));
        $this->userPasswordResetRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserPasswordReset $saved): bool => $saved === $reset
                && 2 === $saved->attempt
                && UnauthorizedStatusEnum::Correct === $saved->status));

        $this->assertSame($reset->id, $this->service->confirm($reset->id, self::passwordDto(123456, 'n3w-Pa55')));
        $this->assertNotSame($oldPassword, $user->password);
        $this->assertNotSame('n3w-Pa55', $user->password);
        $this->assertSame([], $this->dispatched);
    }

    final public function testConfirmWithWrongCodeCountsAttemptAndKeepsPassword(): void
    {
        $user = $this->acceptedUser();
        $oldPassword = $user->password;
        $reset = self::entity(UserPasswordResetFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 2,
            'status' => UnauthorizedStatusEnum::Sent,
        ]));
        $this->userPasswordResetRepository->method('findById')->willReturn($reset);
        $this->userPasswordResetRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserPasswordReset $saved): bool => $saved === $reset
                && 3 === $saved->attempt
                && UnauthorizedStatusEnum::Incorrect === $saved->status));
        $this->hasher->expects($this->never())->method('hashPassword');
        $this->userRepository->expects($this->never())->method('save');

        try {
            $this->service->confirm($reset->id, self::passwordDto(111111, 'n3w-Pa55'));
            $this->fail('Expected SaveValidationException.');
        } catch (SaveValidationException $e) {
            $this->assertSame('Invalid code.', $e->getMessage());
        }

        $this->assertSame($oldPassword, $user->password);
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function confirmGuardProvider(): iterable
    {
        yield 'already used' => [1, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'already used takes precedence over attempts' => [3, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'attempts limit reached' => [3, UnauthorizedStatusEnum::Incorrect, 'Too many attempts.'];
        yield 'attempts limit exceeded' => [9, UnauthorizedStatusEnum::NotSent, 'Too many attempts.'];
    }

    #[DataProvider('confirmGuardProvider')]
    final public function testConfirmGuards(int $attempt, UnauthorizedStatusEnum $status, string $message): void
    {
        $user = $this->acceptedUser();
        $oldPassword = $user->password;
        $reset = self::entity(UserPasswordResetFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => $attempt,
            'status' => $status,
        ]));
        $this->userPasswordResetRepository->method('findById')->willReturn($reset);
        $this->userPasswordResetRepository->expects($this->never())->method('save');
        $this->userRepository->expects($this->never())->method('save');
        $this->hasher->expects($this->never())->method('hashPassword');

        try {
            $this->service->confirm($reset->id, self::passwordDto(123456, 'n3w-Pa55'));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertNotInstanceOf(SaveValidationException::class, $e);
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame($attempt, $reset->attempt);
        $this->assertSame($oldPassword, $user->password);
    }

    final public function testConfirmPropagatesNotFound(): void
    {
        $this->userPasswordResetRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->userRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->confirm(self::user()->id, self::passwordDto(123456, 'n3w-Pa55'));
    }

    final public function testResendDispatchesEmailForExistingCode(): void
    {
        $user = self::user();
        $reset = self::entity(UserPasswordResetFactory::make(['user' => $user, 'attempt' => 2, 'status' => UnauthorizedStatusEnum::Incorrect]));
        $this->userPasswordResetRepository->expects($this->once())->method('findById')->with($reset->id)->willReturn($reset);
        $this->userPasswordResetRepository->expects($this->never())->method('save');

        $this->assertSame($reset->id, $this->service->resend($reset->id));
        $this->assertResetEmails([[$user, $reset]]);
        $this->assertSame(2, $reset->attempt);
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function resendGuardProvider(): iterable
    {
        yield 'already used' => [0, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'attempts limit reached' => [3, UnauthorizedStatusEnum::Incorrect, 'Too many attempts.'];
    }

    #[DataProvider('resendGuardProvider')]
    final public function testResendGuards(int $attempt, UnauthorizedStatusEnum $status, string $message): void
    {
        $reset = self::entity(UserPasswordResetFactory::make(['attempt' => $attempt, 'status' => $status]));
        $this->userPasswordResetRepository->method('findById')->willReturn($reset);

        try {
            $this->service->resend($reset->id);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testResendPropagatesNotFound(): void
    {
        $this->userPasswordResetRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->resend(self::user()->id);
    }

    private function acceptedUser(): User
    {
        return self::entity(UserFactory::make(['status' => UserStatusEnum::Accepted]));
    }

    private function resettableUser(): User
    {
        $user = $this->acceptedUser();
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->confirmedRegistration($user);

        return $user;
    }

    private function confirmedRegistration(User $user): void
    {
        $this->userRegisterRepository->expects($this->once())
            ->method('findLastByUserId')
            ->with($user->id)
            ->willReturn(self::entity(UserRegisterFactory::make(['user' => $user, 'status' => UnauthorizedStatusEnum::Correct])));
    }

    private function latestReset(User $user, int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): UserPasswordReset
    {
        $reset = self::entity(UserPasswordResetFactory::make(['user' => $user, 'attempt' => $attempt, 'status' => $status]));
        $reset->updatedAt = new DateTimeImmutable($updatedAt);

        return $reset;
    }

    private function assertPasswordResetFails(UserEmailDto $dto, string $message): void
    {
        $this->userPasswordResetRepository->expects($this->never())->method('save');

        try {
            $this->service->passwordReset($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    /** @param array{User, UserPasswordReset}[] $expected */
    private function assertResetEmails(array $expected): void
    {
        $this->assertContainsOnlyInstancesOf(UserPasswordResetEmailEvent::class, $this->dispatched);
        $this->assertSame(
            $expected,
            array_map(
                static fn (UserPasswordResetEmailEvent $event): array => [$event->getUser(), $event->getUserPasswordReset()],
                $this->dispatched,
            ),
        );
    }

    private static function emailDto(string $email): UserEmailDto
    {
        $dto = new UserEmailDto();
        $dto->email = $email;

        return $dto;
    }

    private static function passwordDto(int $code, string $password): UserPasswordDto
    {
        $dto = new UserPasswordDto();
        $dto->code = $code;
        $dto->password = $password;

        return $dto;
    }
}
