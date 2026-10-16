<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{UserCodeDto, UserSignDto};
use App\Entity\{User, UserSign};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Event\UserSignEmailEvent;
use App\Exception\SaveValidationException;
use App\Repository\{UserRegisterRepository, UserRepository, UserSignRepository};
use App\Service\SignService;
use DateTimeImmutable;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{UserFactory, UserRegisterFactory, UserSignFactory};

#[AllowMockObjectsWithoutExpectations]
class SignServiceTest extends ServiceTestCase
{
    private UserRepository&MockObject $userRepository;

    private UserRegisterRepository&MockObject $userRegisterRepository;

    private UserSignRepository&MockObject $userSignRepository;

    private UserPasswordHasherInterface&MockObject $hasher;

    private JWTTokenManagerInterface&MockObject $jwtManager;

    private Security&MockObject $security;

    private SignService $service;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->userRegisterRepository = $this->createMock(UserRegisterRepository::class);
        $this->userSignRepository = $this->createMock(UserSignRepository::class);
        $this->hasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->jwtManager = $this->createMock(JWTTokenManagerInterface::class);
        $this->security = $this->createMock(Security::class);

        $this->service = new SignService(
            $this->userRepository,
            $this->userRegisterRepository,
            $this->userSignRepository,
            $this->hasher,
            $this->jwtManager,
            $this->dispatcher(),
            $this->security,
        );
    }

    final public function testSignCreatesNewCodeAndSendsEmail(): void
    {
        $user = $this->activeUser();
        $dto = self::signDto($user->email, 'secret');
        $this->userRepository->expects($this->once())->method('findByEmail')->with($user->email)->willReturn($user);
        $this->hasher->expects($this->once())->method('isPasswordValid')->with($user, 'secret')->willReturn(true);
        $this->confirmedRegistration($user);
        $this->userSignRepository->expects($this->once())->method('findLastByUserId')->with($user->id)->willReturn(null);
        $saved = null;
        $this->userSignRepository->expects($this->once())
            ->method('save')
            ->willReturnCallback(static function (UserSign $userSign) use (&$saved): void {
                $saved = $userSign;
                self::persist()($userSign);
            });

        $id = $this->service->sign($dto);

        $this->assertSame($saved->id, $id);
        $this->assertSame($user, $saved->user);
        $this->assertSame(0, $saved->attempt);
        $this->assertSame(UnauthorizedStatusEnum::NotSent, $saved->status);
        $this->assertGreaterThanOrEqual(100000, $saved->code);
        $this->assertLessThanOrEqual(999999, $saved->code);
        $this->assertSignEmails([[$user, $saved]]);
    }

    final public function testSignRejectsUnknownEmail(): void
    {
        $this->userRepository->expects($this->once())->method('findByEmail')->with('nobody@example.com')->willReturn(null);
        $this->hasher->expects($this->never())->method('isPasswordValid');

        $this->assertSignFails(self::signDto('nobody@example.com', 'secret'), 'User not found.');
    }

    final public function testSignRejectsInvalidPassword(): void
    {
        $user = $this->activeUser();
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->hasher->expects($this->once())->method('isPasswordValid')->with($user, 'wrong')->willReturn(false);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertSignFails(self::signDto($user->email, 'wrong'), 'Invalid password.');
    }

    final public function testSignRejectsBannedUser(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Banned]));
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->hasher->method('isPasswordValid')->willReturn(true);
        $this->userRegisterRepository->expects($this->never())->method('findLastByUserId');

        $this->assertSignFails(self::signDto($user->email, 'secret'), 'User is banned.');
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
    final public function testSignRejectsUnconfirmedAccount(?UnauthorizedStatusEnum $status): void
    {
        $user = $this->activeUser();
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->hasher->method('isPasswordValid')->willReturn(true);
        $this->userRegisterRepository->expects($this->once())
            ->method('findLastByUserId')
            ->with($user->id)
            ->willReturn(null === $status ? null : self::entity(UserRegisterFactory::make(['user' => $user, 'status' => $status])));
        $this->userSignRepository->expects($this->never())->method('findLastByUserId');

        $this->assertSignFails(self::signDto($user->email, 'secret'), 'User account is not confirmed.');
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function lockedOutProvider(): iterable
    {
        yield 'three wrong attempts just now' => [3, UnauthorizedStatusEnum::Incorrect, '-1 minute'];
        yield 'more than three wrong attempts' => [5, UnauthorizedStatusEnum::Incorrect, '-1 hour'];
        yield 'just inside the one day lock' => [3, UnauthorizedStatusEnum::Incorrect, '-23 hours -59 minutes'];
    }

    #[DataProvider('lockedOutProvider')]
    final public function testSignRejectsWhenLatestSignIsLockedOut(int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): void
    {
        $user = $this->signableUser();
        $this->userSignRepository->expects($this->once())
            ->method('findLastByUserId')
            ->with($user->id)
            ->willReturn($this->latestSign($user, $attempt, $status, $updatedAt));

        $this->assertSignFails(self::signDto($user->email, 'secret'), 'Too many attempts.');
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
    final public function testSignAllowsWhenLatestSignIsNotLockedOut(int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): void
    {
        $user = $this->signableUser();
        $this->userSignRepository->method('findLastByUserId')->willReturn($this->latestSign($user, $attempt, $status, $updatedAt));
        $this->userSignRepository->expects($this->once())->method('save')->willReturnCallback(self::persist());

        $id = $this->service->sign(self::signDto($user->email, 'secret'));

        $this->assertCount(1, $this->dispatched);
        $this->assertSame($id, $this->dispatched[0]->getUserSign()->id);
    }

    final public function testConfirmWithCorrectCodeMarksSignCorrectAndReturnsJwt(): void
    {
        $user = $this->activeUser();
        $userSign = self::entity(UserSignFactory::make([
            'user' => $user,
            'code' => 123456,
            'attempt' => 2,
            'status' => UnauthorizedStatusEnum::Sent,
        ]));
        $this->userSignRepository->expects($this->once())->method('findById')->with($userSign->id)->willReturn($userSign);
        $this->userSignRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserSign $saved): bool => $saved === $userSign
                && 3 === $saved->attempt
                && UnauthorizedStatusEnum::Correct === $saved->status));
        $this->jwtManager->expects($this->once())->method('create')->with($user)->willReturn('jwt-token');

        $this->assertSame('jwt-token', $this->service->confirm($userSign->id, self::codeDto(123456)));
        $this->assertSame([], $this->dispatched);
    }

    final public function testConfirmWithWrongCodeCountsAttemptAndMarksIncorrect(): void
    {
        $userSign = self::entity(UserSignFactory::make([
            'code' => 123456,
            'attempt' => 0,
            'status' => UnauthorizedStatusEnum::Sent,
        ]));
        $this->userSignRepository->method('findById')->willReturn($userSign);
        $this->userSignRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (UserSign $saved): bool => $saved === $userSign
                && 1 === $saved->attempt
                && UnauthorizedStatusEnum::Incorrect === $saved->status));
        $this->jwtManager->expects($this->never())->method('create');

        try {
            $this->service->confirm($userSign->id, self::codeDto(654321));
            $this->fail('Expected SaveValidationException.');
        } catch (SaveValidationException $e) {
            $this->assertSame('Invalid code.', $e->getMessage());
        }
    }

    /** @return iterable<string, array{int, UnauthorizedStatusEnum, string}> */
    public static function confirmGuardProvider(): iterable
    {
        yield 'already used' => [0, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'already used takes precedence over attempts' => [3, UnauthorizedStatusEnum::Correct, 'Code already used.'];
        yield 'attempts limit reached' => [3, UnauthorizedStatusEnum::Incorrect, 'Too many attempts.'];
        yield 'attempts limit exceeded' => [4, UnauthorizedStatusEnum::Sent, 'Too many attempts.'];
    }

    #[DataProvider('confirmGuardProvider')]
    final public function testConfirmGuards(int $attempt, UnauthorizedStatusEnum $status, string $message): void
    {
        $userSign = self::entity(UserSignFactory::make(['code' => 123456, 'attempt' => $attempt, 'status' => $status]));
        $this->userSignRepository->method('findById')->willReturn($userSign);
        $this->userSignRepository->expects($this->never())->method('save');
        $this->jwtManager->expects($this->never())->method('create');

        try {
            $this->service->confirm($userSign->id, self::codeDto(123456));
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertNotInstanceOf(SaveValidationException::class, $e);
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame($attempt, $userSign->attempt);
    }

    final public function testConfirmPropagatesNotFound(): void
    {
        $this->userSignRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->userSignRepository->expects($this->never())->method('save');

        $this->expectException(NotFoundHttpException::class);

        $this->service->confirm(self::user()->id, self::codeDto(123456));
    }

    final public function testResendDispatchesEmailForExistingCode(): void
    {
        $user = self::user();
        $userSign = self::entity(UserSignFactory::make(['user' => $user, 'attempt' => 2, 'status' => UnauthorizedStatusEnum::Sent]));
        $this->userSignRepository->expects($this->once())->method('findById')->with($userSign->id)->willReturn($userSign);
        $this->userSignRepository->expects($this->never())->method('save');

        $this->assertSame($userSign->id, $this->service->resend($userSign->id));
        $this->assertSignEmails([[$user, $userSign]]);
        $this->assertSame(2, $userSign->attempt);
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
        $userSign = self::entity(UserSignFactory::make(['attempt' => $attempt, 'status' => $status]));
        $this->userSignRepository->method('findById')->willReturn($userSign);

        try {
            $this->service->resend($userSign->id);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testResendPropagatesNotFound(): void
    {
        $this->userSignRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->resend(self::user()->id);
    }

    /** @return iterable<string, array{string}> */
    public static function validRefreshProvider(): iterable
    {
        yield 'just confirmed' => ['now'];
        yield 'just inside the 30 day lifetime' => ['-30 days +1 minute'];
    }

    #[DataProvider('validRefreshProvider')]
    final public function testRefreshReturnsNewJwt(string $updatedAt): void
    {
        $user = $this->activeUser();
        $this->security->method('getUser')->willReturn($user);
        $userSign = self::entity(UserSignFactory::make(['user' => $user, 'status' => UnauthorizedStatusEnum::Correct]));
        $userSign->updatedAt = new DateTimeImmutable($updatedAt);
        $this->userSignRepository->expects($this->once())->method('findById')->with($userSign->id)->willReturn($userSign);
        $this->userSignRepository->expects($this->never())->method('save');
        $this->jwtManager->expects($this->once())->method('create')->with($user)->willReturn('fresh-jwt');

        $this->assertSame('fresh-jwt', $this->service->refresh($userSign->id));
    }

    /** @return iterable<string, array{UnauthorizedStatusEnum, string, UserStatusEnum, string}> */
    public static function refreshGuardProvider(): iterable
    {
        yield 'not sent' => [UnauthorizedStatusEnum::NotSent, 'now', UserStatusEnum::Accepted, 'Sign not confirmed.'];
        yield 'sent' => [UnauthorizedStatusEnum::Sent, 'now', UserStatusEnum::Accepted, 'Sign not confirmed.'];
        yield 'incorrect' => [UnauthorizedStatusEnum::Incorrect, 'now', UserStatusEnum::Accepted, 'Sign not confirmed.'];
        yield 'just outside the 30 day lifetime' => [UnauthorizedStatusEnum::Correct, '-30 days -1 minute', UserStatusEnum::Accepted, 'Sign expired.'];
        yield 'long expired' => [UnauthorizedStatusEnum::Correct, '-1 year', UserStatusEnum::Accepted, 'Sign expired.'];
        yield 'banned user' => [UnauthorizedStatusEnum::Correct, 'now', UserStatusEnum::Banned, 'User is banned.'];
    }

    #[DataProvider('refreshGuardProvider')]
    final public function testRefreshGuards(
        UnauthorizedStatusEnum $status,
        string $updatedAt,
        UserStatusEnum $userStatus,
        string $message,
    ): void {
        $user = self::entity(UserFactory::make(['status' => $userStatus]));
        $this->security->method('getUser')->willReturn($user);
        $userSign = self::entity(UserSignFactory::make(['user' => $user, 'status' => $status]));
        $userSign->updatedAt = new DateTimeImmutable($updatedAt);
        $this->userSignRepository->method('findById')->willReturn($userSign);
        $this->jwtManager->expects($this->never())->method('create');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage($message);

        $this->service->refresh($userSign->id);
    }

    final public function testRefreshPropagatesNotFound(): void
    {
        $user = self::user();
        $this->security->method('getUser')->willReturn($user);
        $this->userSignRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->jwtManager->expects($this->never())->method('create');

        $this->expectException(NotFoundHttpException::class);

        $this->service->refresh($user->id);
    }

    private function activeUser(): User
    {
        return self::entity(UserFactory::make(['status' => UserStatusEnum::Accepted]));
    }

    private function signableUser(): User
    {
        $user = $this->activeUser();
        $this->userRepository->method('findByEmail')->willReturn($user);
        $this->hasher->method('isPasswordValid')->willReturn(true);
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

    private function latestSign(User $user, int $attempt, UnauthorizedStatusEnum $status, string $updatedAt): UserSign
    {
        $userSign = self::entity(UserSignFactory::make(['user' => $user, 'attempt' => $attempt, 'status' => $status]));
        $userSign->updatedAt = new DateTimeImmutable($updatedAt);

        return $userSign;
    }

    private function assertSignFails(UserSignDto $dto, string $message): void
    {
        $this->userSignRepository->expects($this->never())->method('save');

        try {
            $this->service->sign($dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame($message, $e->getMessage());
        }

        $this->assertSame([], $this->dispatched);
    }

    /** @param array{User, UserSign}[] $expected */
    private function assertSignEmails(array $expected): void
    {
        $this->assertContainsOnlyInstancesOf(UserSignEmailEvent::class, $this->dispatched);
        $this->assertSame(
            $expected,
            array_map(static fn (UserSignEmailEvent $event): array => [$event->getUser(), $event->getUserSign()], $this->dispatched),
        );
    }

    private static function signDto(string $email, string $password): UserSignDto
    {
        $dto = new UserSignDto();
        $dto->email = $email;
        $dto->password = $password;

        return $dto;
    }

    private static function codeDto(int $code): UserCodeDto
    {
        $dto = new UserCodeDto();
        $dto->code = $code;

        return $dto;
    }
}
