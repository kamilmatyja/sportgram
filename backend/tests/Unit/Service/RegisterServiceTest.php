<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{UserCodeDto, UserEmailDto};
use App\Entity\{UserRegister};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Event\UserRegisterEmailEvent;
use App\Exception\SaveValidationException;
use App\Repository\{UserRegisterRepository, UserRepository};
use App\Service\RegisterService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{UserFactory, UserRegisterFactory};

#[AllowMockObjectsWithoutExpectations]
class RegisterServiceTest extends ServiceTestCase
{
    private UserRepository&MockObject $userRepository;

    private UserRegisterRepository&MockObject $userRegisterRepository;

    private RegisterService $service;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->userRegisterRepository = $this->createMock(UserRegisterRepository::class);

        $this->service = new RegisterService(
            $this->userRepository,
            $this->userRegisterRepository,
            $this->dispatcher(),
        );
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum}> */
    public static function registerableProvider(): iterable
    {
        yield 'not sent yet' => [0, UnauthorizedStatusEnum::NotSent];
        yield 'sent' => [0, UnauthorizedStatusEnum::Sent];
        yield 'two wrong attempts' => [2, UnauthorizedStatusEnum::Incorrect];
        yield 'three attempts but status sent' => [3, UnauthorizedStatusEnum::Sent];
    }

    #[DataProvider('registerableProvider')]
    final public function testRegisterReturnsLatestPendingRegistrationWithoutSideEffects(int $attempt, UnauthorizedStatusEnum $status): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Pending]));
        $userRegister = self::entity(UserRegisterFactory::make(['user' => $user, 'attempt' => $attempt, 'status' => $status]));
        $this->userRepository->expects($this->once())->method('findByEmail')->with($user->email)->willReturn($user);
        $this->userRegisterRepository->expects($this->once())->method('findLastByUserId')->with($user->id)->willReturn($userRegister);
        $this->userRegisterRepository->expects($this->never())->method('save');

        $this->assertSame($userRegister->id, $this->service->register(self::emailDto($user->email)));
        $this->assertSame([], $this->dispatched);
    }

    final public function testRegisterRejectsUnknownEmail(): void
    {
        $this->userRepository->expects($this->once())->method('findByEmail')->with('nobody@example.com')->willReturn(null);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertRegisterFails(self::emailDto('nobody@example.com'), 'User not found.');
    }

    final public function testRegisterRejectsBannedUser(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Banned]));
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertRegisterFails(self::emailDto($user->email), 'User is banned.');
    }

    final public function testRegisterRejectsAlreadyConfirmedAccount(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Accepted]));
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->userRegisterRepository->method('findLastByUserId')->willReturn(
            self::entity(UserRegisterFactory::make(['user' => $user, 'attempt' => 3, 'status' => UnauthorizedStatusEnum::Correct])),
        );

        $this->assertRegisterFails(self::emailDto($user->email), 'Code already used.');
    }

    final public function testRegisterLockoutNeverExpires(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Pending]));
        $userRegister = self::entity(UserRegisterFactory::make(['user' => $user, 'attempt' => 3, 'status' => UnauthorizedStatusEnum::Incorrect]));
        $userRegister->updatedAt = new DateTimeImmutable('-1 year');
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->userRegisterRepository->method('findLastByUserId')->willReturn($userRegister);

        $this->assertRegisterFails(self::emailDto($user->email), 'Too many attempts.');
    }

    final public function testConfirmWithCorrectCodeMarksRegistrationCorrect(): void
    {
        $userRegister = self::entity(UserRegisterFactory::make(['code' => 123456, 'attempt' => 0, 'status' => UnauthorizedStatusEnum::Sent]));
        $this->userRegisterRepository->expects($this->once())->method('findById')->with($userRegister->id)->willReturn($userRegister);
        $this->userRegisterRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserRegister $saved): bool => $saved === $userRegister
                && 1 === $saved->attempt
                && UnauthorizedStatusEnum::Correct === $saved->status));
        $this->userRepository->expects($this->never())->method('save');

        $this->assertSame($userRegister->id, $this->service->confirm($userRegister->id, self::codeDto(123456)));
        $this->assertSame([], $this->dispatched);
    }

    final public function testConfirmWithWrongCodeCountsAttemptAndMarksIncorrect(): void
    {
        $userRegister = self::entity(UserRegisterFactory::make(['code' => 123456, 'attempt' => 2, 'status' => UnauthorizedStatusEnum::Incorrect]));
        $this->userRegisterRepository->method('findById')->willReturn($userRegister);
        $this->userRegisterRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserRegister $saved): bool => $saved === $userRegister
                && 3 === $saved->attempt
                && UnauthorizedStatusEnum::Incorrect === $saved->status));

        try {
            $this->service->confirm($userRegister->id, self::codeDto(123457));
            $this->fail('Expected SaveValidationException.');
        } catch (SaveValidationException $e) {
            $this->assertSame('Invalid code.', $e->getMessage());
        }
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function guardProvider(): iterable
    {
        yield 'already used' => [1, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'already used takes precedence over attempts' => [3, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'attempts limit reached' => [3, UnauthorizedStatusEnum::Incorrect, 'Too many attempts.'];
        yield 'attempts limit exceeded' => [5, UnauthorizedStatusEnum::Sent, 'Too many attempts.'];
    }

    #[DataProvider('guardProvider')]
    final public function testConfirmGuards(int $attempt, UnauthorizedStatusEnum $status, string $message): void
    {
        $userRegister = self::entity(UserRegisterFactory::make(['code' => 123456, 'attempt' => $attempt, 'status' => $status]));
        $this->userRegisterRepository->method('findById')->willReturn($userRegister);
        $this->userRegisterRepository->expects($this->never())->method('save');

        try {
            $this->service->confirm($userRegister->id, self::codeDto(123456));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertNotInstanceOf(SaveValidationException::class, $e);
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame($attempt, $userRegister->attempt);
        $this->assertSame($status, $userRegister->status);
    }

    final public function testConfirmPropagatesNotFound(): void
    {
        $this->userRegisterRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->userRegisterRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->confirm(self::user()->id, self::codeDto(123456));
    }

    final public function testResendDispatchesEmailForExistingCode(): void
    {
        $user = self::user();
        $userRegister = self::entity(UserRegisterFactory::make(['user' => $user, 'attempt' => 2, 'status' => UnauthorizedStatusEnum::Sent]));
        $this->userRegisterRepository->expects($this->once())->method('findById')->with($userRegister->id)->willReturn($userRegister);
        $this->userRegisterRepository->expects($this->never())->method('save');

        $this->assertSame($userRegister->id, $this->service->resend($userRegister->id));
        $this->assertContainsOnlyInstancesOf(UserRegisterEmailEvent::class, $this->dispatched);
        $this->assertSame(
            [[$user, $userRegister]],
            array_map(static fn (UserRegisterEmailEvent $event): array => [$event->getUser(), $event->getUserRegister()], $this->dispatched),
        );
        $this->assertSame(2, $userRegister->attempt);
    }

    #[DataProvider('guardProvider')]
    final public function testResendGuards(int $attempt, UnauthorizedStatusEnum $status, string $message): void
    {
        $userRegister = self::entity(UserRegisterFactory::make(['attempt' => $attempt, 'status' => $status]));
        $this->userRegisterRepository->method('findById')->willReturn($userRegister);

        try {
            $this->service->resend($userRegister->id);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testResendPropagatesNotFound(): void
    {
        $this->userRegisterRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->resend(self::user()->id);
    }

    private function assertRegisterFails(UserEmailDto $dto, string $message): void
    {
        try {
            $this->service->register($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    private static function emailDto(string $email): UserEmailDto
    {
        $dto = new UserEmailDto();
        $dto->email = $email;

        return $dto;
    }

    private static function codeDto(int $code): UserCodeDto
    {
        $dto = new UserCodeDto();
        $dto->code = $code;

        return $dto;
    }
}
