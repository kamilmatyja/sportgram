<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Dto\{UserCreateDto, UserCreateNanoDto, UserIndexDto, UserStatusDto, UserUpdateDto};
use App\Entity\{User, UserDiscipline, UserRegister, UserRole};
use App\Enum\{ColorEnum,
    CountryEnum,
    DisciplineEnum,
    GenderEnum,
    LanguageEnum,
    NotificationTypeEnum,
    RoleEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Event\{NotificationEvent, UserRegisterEmailEvent};
use App\Repository\{UserDisciplineRepository, UserRegisterRepository, UserRepository, UserRoleRepository};
use App\Security\Voter\AssignAdminRoleVoter;
use App\Service\UserService;
use DateTimeImmutable;
use PHPUnit\Framework\Attributes\{AllowMockObjectsWithoutExpectations, DataProvider};
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Validator\Exception\ValidatorException;
use Tests\Factory\{PageFactory, UserDisciplineFactory, UserFactory, UserRoleFactory};

#[AllowMockObjectsWithoutExpectations]
class UserServiceTest extends ServiceTestCase
{
    private UserRepository&MockObject $userRepository;

    private UserRoleRepository&MockObject $userRoleRepository;

    private UserDisciplineRepository&MockObject $userDisciplineRepository;

    private UserRegisterRepository&MockObject $userRegisterRepository;

    private UserPasswordHasherInterface&MockObject $hasher;

    private AuthorizationCheckerInterface&MockObject $authorizationChecker;

    private UserService $service;

    /** @var array{string, object}[] */
    private array $writes = [];

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->userRoleRepository = $this->createMock(UserRoleRepository::class);
        $this->userDisciplineRepository = $this->createMock(UserDisciplineRepository::class);
        $this->userRegisterRepository = $this->createMock(UserRegisterRepository::class);
        $this->hasher = $this->createMock(UserPasswordHasherInterface::class);
        $this->authorizationChecker = $this->createMock(AuthorizationCheckerInterface::class);

        $this->service = new UserService(
            $this->userRepository,
            $this->userRoleRepository,
            $this->userDisciplineRepository,
            $this->userRegisterRepository,
            $this->hasher,
            $this->authorizationChecker,
            $this->dispatcher(),
        );
    }

    final public function testCreateSavesNormalizedUserRolesDisciplinesAndRegistration(): void
    {
        $dto = new UserCreateDto();
        $dto->birthAt = new DateTimeImmutable('1990-05-17');
        $dto->firstName = 'łUKASZ';
        $dto->lastName = 'nOWAK-kOWALSKA';
        $dto->gender = GenderEnum::Male;
        $dto->phone = 123456789;
        $dto->email = 'Lukasz.NOWAK@Example.COM';
        $dto->password = 'plain-Pa55';
        $dto->link = 'lukasz';
        $dto->language = LanguageEnum::English;
        $dto->country = CountryEnum::Austria;
        $dto->theme = ThemeEnum::Dark;
        $dto->color = ColorEnum::Green;
        $dto->profilePhoto = base64_encode('profile-bytes');
        $dto->backgroundPhoto = base64_encode('background-bytes');
        $dto->bio = 'Bio';
        $dto->roles = [RoleEnum::Participant, RoleEnum::Organizer];
        $dto->disciplines = [DisciplineEnum::Running, DisciplineEnum::Cycling];
        $this->hasher->expects($this->once())
            ->method('hashPassword')
            ->with($this->isInstanceOf(User::class), 'plain-Pa55')
            ->willReturn('hashed-pass');
        $this->recordWrites();

        $id = $this->service->create($dto);

        $user = $this->writes[0][1];
        $this->assertSame('user.save', $this->writes[0][0]);
        $this->assertSame($user->id, $id);
        $this->assertEquals(new DateTimeImmutable('1990-05-17'), $user->birthAt);
        $this->assertSame('Łukasz', $user->firstName);
        $this->assertSame('Nowak-kowalska', $user->lastName);
        $this->assertSame(GenderEnum::Male, $user->gender);
        $this->assertSame(123456789, $user->phone);
        $this->assertSame('lukasz.nowak@example.com', $user->email);
        $this->assertSame('hashed-pass', $user->password);
        $this->assertSame('lukasz', $user->link);
        $this->assertSame(LanguageEnum::English, $user->language);
        $this->assertSame(CountryEnum::Austria, $user->country);
        $this->assertSame(ThemeEnum::Dark, $user->theme);
        $this->assertSame(ColorEnum::Green, $user->color);
        $this->assertSame(base64_encode('profile-bytes'), $user->profilePhoto);
        $this->assertSame(base64_encode('background-bytes'), $user->backgroundPhoto);
        $this->assertSame('Bio', $user->bio);
        $this->assertSame(UserStatusEnum::Pending, $user->status);

        $this->assertSame(
            ['user.save', 'role.save', 'role.save', 'discipline.save', 'discipline.save', 'register.save'],
            array_column($this->writes, 0),
        );
        $this->assertRoles($user, [RoleEnum::Participant, RoleEnum::Organizer], [$this->writes[1][1], $this->writes[2][1]]);
        $this->assertDisciplines($user, [DisciplineEnum::Running, DisciplineEnum::Cycling], [$this->writes[3][1], $this->writes[4][1]]);
        $register = $this->writes[5][1];
        $this->assertNewRegistration($user, $register);
        $this->assertRegisterEmails([[$user, $register]]);
    }

    final public function testCreateWithoutRolesAndDisciplinesSavesOnlyUserAndRegistration(): void
    {
        $dto = new UserCreateDto();
        $dto->birthAt = new DateTimeImmutable('2000-01-01');
        $dto->firstName = 'Jan';
        $dto->lastName = 'Kowalski';
        $dto->gender = GenderEnum::Male;
        $dto->phone = 987654321;
        $dto->email = 'jan@example.com';
        $dto->password = 'secret';
        $dto->link = 'jan';
        $dto->language = LanguageEnum::Polish;
        $dto->country = CountryEnum::Albania;
        $dto->theme = ThemeEnum::Light;
        $dto->color = ColorEnum::Red;
        $dto->profilePhoto = base64_encode('p');
        $dto->backgroundPhoto = base64_encode('b');
        $dto->bio = 'Bio';
        $this->hasher->method('hashPassword')->willReturn('hashed');
        $this->recordWrites();

        $this->service->create($dto);

        $this->assertSame(['user.save', 'register.save'], array_column($this->writes, 0));
        $this->assertCount(1, $this->dispatched);
    }

    final public function testCreateNanoFillsDefaultsAndSavesRolesAndRegistration(): void
    {
        $dto = new UserCreateNanoDto();
        $dto->birthAt = new DateTimeImmutable('1995-03-03');
        $dto->firstName = 'anna';
        $dto->lastName = 'NOWAK';
        $dto->gender = GenderEnum::Female;
        $dto->phone = 555666777;
        $dto->email = 'Anna@Example.com';
        $dto->password = 'plain-Pa55';
        $dto->country = CountryEnum::Andorra;
        $dto->roles = [RoleEnum::Participant];
        $this->hasher->expects($this->once())
            ->method('hashPassword')
            ->with($this->isInstanceOf(User::class), 'plain-Pa55')
            ->willReturn('hashed-pass');
        $this->userDisciplineRepository->expects($this->never())->method('save');
        $this->recordWrites();

        $id = $this->service->createNano($dto);

        $this->assertSame(['user.save', 'role.save', 'register.save'], array_column($this->writes, 0));
        $user = $this->writes[0][1];
        $this->assertSame($user->id, $id);
        $this->assertEquals(new DateTimeImmutable('1995-03-03'), $user->birthAt);
        $this->assertSame('Anna', $user->firstName);
        $this->assertSame('Nowak', $user->lastName);
        $this->assertSame(GenderEnum::Female, $user->gender);
        $this->assertSame(555666777, $user->phone);
        $this->assertSame('anna@example.com', $user->email);
        $this->assertSame('hashed-pass', $user->password);
        $this->assertMatchesRegularExpression('/^anna-NOWAK-[1-9]\d{2}$/', $user->link);
        $this->assertSame('anna NOWAK bio', $user->bio);
        $this->assertSame(LanguageEnum::Polish, $user->language);
        $this->assertSame(CountryEnum::Andorra, $user->country);
        $this->assertSame(ThemeEnum::Light, $user->theme);
        $this->assertSame(ColorEnum::Blue, $user->color);
        $publicDir = dirname(__DIR__, 3) . '/public';
        $this->assertSame(base64_encode(file_get_contents($publicDir . '/profile.webp')), $user->profilePhoto);
        $this->assertSame(base64_encode(file_get_contents($publicDir . '/background.webp')), $user->backgroundPhoto);
        $this->assertSame(UserStatusEnum::Pending, $user->status);
        $this->assertRoles($user, [RoleEnum::Participant], [$this->writes[1][1]]);
        $this->assertNewRegistration($user, $this->writes[2][1]);
        $this->assertRegisterEmails([[$user, $this->writes[2][1]]]);
    }

    final public function testUpdateReplacesFieldsRolesAndDisciplines(): void
    {
        $user = self::entity(UserFactory::make(['status' => UserStatusEnum::Accepted]));
        $oldRoles = [
            self::entity(UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Participant])),
            self::entity(UserRoleFactory::make(['user' => $user, 'role' => RoleEnum::Organizer])),
        ];
        $oldDiscipline = self::entity(UserDisciplineFactory::make(['user' => $user, 'discipline' => DisciplineEnum::Running]));
        array_map($user->roles->add(...), $oldRoles);
        $user->disciplines->add($oldDiscipline);
        $dto = $this->updateDto();
        $dto->password = 'n3w-Pa55';
        $dto->roles = [RoleEnum::Administrator];
        $dto->disciplines = [DisciplineEnum::Cycling, DisciplineEnum::InlineSkating];
        $this->authorizationChecker->expects($this->once())
            ->method('isGranted')
            ->with(AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE, $dto)
            ->willReturn(true);
        $this->userRepository->expects($this->once())->method('findById')->with($user->id)->willReturn($user);
        $this->hasher->expects($this->once())->method('hashPassword')->with($user, 'n3w-Pa55')->willReturn('hashed-n3w');
        $this->recordWrites();

        $this->assertSame($user->id, $this->service->update($user->id, $dto));

        $this->assertSame(
            ['role.delete', 'role.delete', 'role.save', 'discipline.delete', 'discipline.save', 'discipline.save', 'user.save'],
            array_column($this->writes, 0),
        );
        $this->assertSame($oldRoles[0], $this->writes[0][1]);
        $this->assertSame($oldRoles[1], $this->writes[1][1]);
        $this->assertRoles($user, [RoleEnum::Administrator], [$this->writes[2][1]]);
        $this->assertSame($oldDiscipline, $this->writes[3][1]);
        $this->assertDisciplines($user, [DisciplineEnum::Cycling, DisciplineEnum::InlineSkating], [$this->writes[4][1], $this->writes[5][1]]);
        $this->assertSame($user, $this->writes[6][1]);

        $this->assertEquals(new DateTimeImmutable('1988-08-08'), $user->birthAt);
        $this->assertSame('Żaneta', $user->firstName);
        $this->assertSame('Ślęzak', $user->lastName);
        $this->assertSame(GenderEnum::Female, $user->gender);
        $this->assertSame(111222333, $user->phone);
        $this->assertSame('zaneta@example.com', $user->email);
        $this->assertSame('hashed-n3w', $user->password);
        $this->assertSame('zaneta', $user->link);
        $this->assertSame(LanguageEnum::Polish, $user->language);
        $this->assertSame(CountryEnum::Austria, $user->country);
        $this->assertSame(ThemeEnum::Dark, $user->theme);
        $this->assertSame(ColorEnum::Red, $user->color);
        $this->assertSame(base64_encode('new-profile'), $user->profilePhoto);
        $this->assertSame(base64_encode('new-background'), $user->backgroundPhoto);
        $this->assertSame('New bio', $user->bio);
        $this->assertSame(UserStatusEnum::Accepted, $user->status);
        $this->assertSame([], $this->dispatched);
    }

    /** @return iterable<string, array{?string}> */
    public static function emptyPasswordProvider(): iterable
    {
        yield 'null' => [null];
        yield 'empty string' => [''];
        yield 'zero string' => ['0'];
    }

    #[DataProvider('emptyPasswordProvider')]
    final public function testUpdateKeepsPasswordWhenEmpty(?string $password): void
    {
        $user = self::user();
        $oldPassword = $user->password;
        $dto = $this->updateDto();
        $dto->password = $password;
        $this->authorizationChecker->method('isGranted')->willReturn(true);
        $this->userRepository->method('findById')->willReturn($user);
        $this->hasher->expects($this->never())->method('hashPassword');
        $this->recordWrites();

        $this->service->update($user->id, $dto);

        $this->assertSame($oldPassword, $user->password);
        $this->assertSame(['user.save'], array_column($this->writes, 0));
    }

    final public function testUpdateRejectsRoleTheCurrentUserMayNotAssign(): void
    {
        $user = self::user();
        $user->roles->add(self::entity(UserRoleFactory::make(['user' => $user])));
        $oldFirstName = $user->firstName;
        $dto = $this->updateDto();
        $dto->roles = [RoleEnum::Administrator];
        $this->authorizationChecker->expects($this->once())
            ->method('isGranted')
            ->with(AssignAdminRoleVoter::ASSIGN_ADMIN_ROLE, $dto)
            ->willReturn(false);
        $this->userRepository->expects($this->never())->method('findById');
        $this->hasher->expects($this->never())->method('hashPassword');
        $this->recordWrites();

        try {
            $this->service->update($user->id, $dto);
            $this->fail('Expected ValidatorException.');
        } catch (ValidatorException $e) {
            $this->assertSame('Role not allowed for this user.', $e->getMessage());
        }

        $this->assertSame([], $this->writes);
        $this->assertSame($oldFirstName, $user->firstName);
    }

    final public function testUpdatePropagatesNotFound(): void
    {
        $this->authorizationChecker->method('isGranted')->willReturn(true);
        $this->userRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->recordWrites();

        try {
            $this->service->update(self::user()->id, $this->updateDto());
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->writes);
    }

    final public function testUpdateStatusSavesStatusAndNotifiesUser(): void
    {
        $user = self::entity(UserFactory::make([
            'firstName' => 'Jan',
            'lastName' => 'Kowalski',
            'link' => 'jan',
            'status' => UserStatusEnum::Pending,
        ]));
        $dto = new UserStatusDto();
        $dto->status = UserStatusEnum::Banned;
        $this->userRepository->expects($this->once())->method('findById')->with($user->id)->willReturn($user);
        $this->userRepository->expects($this->once())
            ->method('save')
            ->with($this->callback(static fn (User $saved): bool => $saved === $user && UserStatusEnum::Banned === $saved->status));

        $this->assertSame($user->id, $this->service->updateStatus($user->id, $dto));
        $this->assertContainsOnlyInstancesOf(NotificationEvent::class, $this->dispatched);
        $this->assertSame(
            [[$user, NotificationTypeEnum::UserStatus, 'Jan Kowalski', '/users/jan']],
            array_map(
                static fn (NotificationEvent $event): array => [$event->getUser(), $event->getType(), $event->getText(), $event->getLink()],
                $this->dispatched,
            ),
        );
    }

    final public function testUpdateStatusPropagatesNotFound(): void
    {
        $dto = new UserStatusDto();
        $dto->status = UserStatusEnum::Accepted;
        $this->userRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->userRepository->expects($this->never())->method('save');

        try {
            $this->service->updateStatus(self::user()->id, $dto);
            $this->fail('Expected NotFoundHttpException.');
        } catch (NotFoundHttpException) {
        }

        $this->assertSame([], $this->dispatched);
    }

    final public function testDeleteRemovesUserWithoutPages(): void
    {
        $user = self::user();
        $this->userRepository->expects($this->once())->method('findById')->with($user->id)->willReturn($user);
        $this->userRepository->expects($this->once())->method('delete')->with($user);

        $this->assertSame($user->id, $this->service->delete($user->id));
    }

    final public function testDeleteRejectsUserWithPages(): void
    {
        $user = self::user();
        $user->pages->add(self::entity(PageFactory::make(['user' => $user])));
        $this->userRepository->method('findById')->willReturn($user);
        $this->userRepository->expects($this->never())->method('delete');

        $this->expectException(ValidatorException::class);
        $this->expectExceptionMessage('Cannot delete user with pages.');

        $this->service->delete($user->id);
    }

    final public function testDeletePropagatesNotFound(): void
    {
        $this->userRepository->method('findById')->willThrowException(new NotFoundHttpException());
        $this->userRepository->expects($this->never())->method('delete');

        $this->expectException(NotFoundHttpException::class);

        $this->service->delete(self::user()->id);
    }

    final public function testIndexDelegatesToRepository(): void
    {
        $dto = new UserIndexDto();
        $window = self::window([self::user()]);
        $this->userRepository->expects($this->once())->method('findUsers')->with($dto)->willReturn($window);

        $this->assertSame($window, $this->service->index($dto));
    }

    final public function testDetails(): void
    {
        $user = self::user();
        $this->userRepository->expects($this->once())->method('findById')->with($user->id)->willReturn($user);

        $this->assertSame($user, $this->service->details($user->id));
    }

    final public function testDetailsPropagatesNotFound(): void
    {
        $this->userRepository->method('findById')->willThrowException(new NotFoundHttpException());

        $this->expectException(NotFoundHttpException::class);

        $this->service->details(self::user()->id);
    }

    private function recordWrites(): void
    {
        $repositories = [
            'user' => $this->userRepository,
            'role' => $this->userRoleRepository,
            'discipline' => $this->userDisciplineRepository,
            'register' => $this->userRegisterRepository,
        ];

        foreach ($repositories as $name => $repository) {
            $repository->method('save')->willReturnCallback(function (object $entity) use ($name): void {
                self::persist()($entity);
                $this->writes[] = [$name . '.save', $entity];
            });

            if ('register' !== $name) {
                $repository->method('delete')->willReturnCallback(function (object $entity) use ($name): void {
                    $this->writes[] = [$name . '.delete', $entity];
                });
            }
        }
    }

    private function updateDto(): UserUpdateDto
    {
        $dto = new UserUpdateDto();
        $dto->birthAt = new DateTimeImmutable('1988-08-08');
        $dto->firstName = 'ŻANETA';
        $dto->lastName = 'śLĘZAK';
        $dto->gender = GenderEnum::Female;
        $dto->phone = 111222333;
        $dto->email = 'Zaneta@EXAMPLE.com';
        $dto->link = 'zaneta';
        $dto->language = LanguageEnum::Polish;
        $dto->country = CountryEnum::Austria;
        $dto->theme = ThemeEnum::Dark;
        $dto->color = ColorEnum::Red;
        $dto->profilePhoto = base64_encode('new-profile');
        $dto->backgroundPhoto = base64_encode('new-background');
        $dto->bio = 'New bio';

        return $dto;
    }

    /**
     * @param RoleEnum[] $expected
     * @param object[]   $saved
     */
    private function assertRoles(User $user, array $expected, array $saved): void
    {
        $this->assertContainsOnlyInstancesOf(UserRole::class, $saved);
        $this->assertSame(
            array_map(static fn (RoleEnum $role): array => [$user, $role], $expected),
            array_map(static fn (UserRole $role): array => [$role->user, $role->role], $saved),
        );
    }

    /**
     * @param DisciplineEnum[] $expected
     * @param object[]         $saved
     */
    private function assertDisciplines(User $user, array $expected, array $saved): void
    {
        $this->assertContainsOnlyInstancesOf(UserDiscipline::class, $saved);
        $this->assertSame(
            array_map(static fn (DisciplineEnum $discipline): array => [$user, $discipline], $expected),
            array_map(static fn (UserDiscipline $discipline): array => [$discipline->user, $discipline->discipline], $saved),
        );
    }

    private function assertNewRegistration(User $user, object $register): void
    {
        $this->assertInstanceOf(UserRegister::class, $register);
        $this->assertSame($user, $register->user);
        $this->assertSame(0, $register->attempt);
        $this->assertSame(UnauthorizedStatusEnum::NotSent, $register->status);
        $this->assertGreaterThanOrEqual(100000, $register->code);
        $this->assertLessThanOrEqual(999999, $register->code);
    }

    /** @param array{User, UserRegister}[] $expected */
    private function assertRegisterEmails(array $expected): void
    {
        $this->assertContainsOnlyInstancesOf(UserRegisterEmailEvent::class, $this->dispatched);
        $this->assertSame(
            $expected,
            array_map(static fn (UserRegisterEmailEvent $event): array => [$event->getUser(), $event->getUserRegister()], $this->dispatched),
        );
    }
}
