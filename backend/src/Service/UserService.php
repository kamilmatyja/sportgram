<?php

namespace App\Service;

use App\Dto\{UserCreateDto, UserCreateNanoDto, UserDetailsQueryDto, UserIndexDto, UserUpdateDto, UserUpdateStatusDto};
use App\Entity\{User, UserDiscipline, UserRegister, UserRole};
use App\Enum\{ColorEnum,
    CountryEnum,
    DisciplineEnum,
    GenderEnum,
    LanguageEnum,
    RoleEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Repository\{UserDisciplineRepository, UserRegisterRepository, UserRepository, UserRoleRepository};
use App\Security\Voter\UserRoleVoter;
use DateMalformedStringException;
use DateTimeImmutable;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRoleRepository $userRoleRepository,
        private UserDisciplineRepository $userDisciplineRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserPasswordHasherInterface $hasher,
        private AuthorizationCheckerInterface $authorizationChecker,
        private RegisterService $registerService,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function create(UserCreateDto $dto): Uuid
    {
        $user = new User(
            new DateTimeImmutable($dto->birthAt),
            mb_ucfirst(mb_strtolower($dto->firstName)),
            mb_ucfirst(mb_strtolower($dto->lastName)),
            GenderEnum::from($dto->gender),
            $dto->phone,
            mb_strtolower($dto->email),
            $dto->link,
            LanguageEnum::from($dto->language),
            CountryEnum::from($dto->country),
            ThemeEnum::from($dto->theme),
            ColorEnum::from($dto->color),
            base64_decode($dto->profilePhoto, true),
            base64_decode($dto->backgroundPhoto, true),
            $dto->bio,
            UserStatusEnum::Pending,
        );

        $user->password = $this->hasher->hashPassword($user, $dto->password);

        $this->userRepository->save($user);

        foreach ($dto->roles as $role) {
            $role = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->save($role);
        }

        foreach ($dto->disciplines ?? [] as $discipline) {
            $discipline = new UserDiscipline($user, DisciplineEnum::from($discipline));
            $this->userDisciplineRepository->save($discipline);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->save($userRegister);

        $this->registerService->sendEmail($user, $userRegister);

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function createNano(UserCreateNanoDto $dto): Uuid
    {
        $user = new User(
            new DateTimeImmutable($dto->birthAt),
            mb_ucfirst(mb_strtolower($dto->firstName)),
            mb_ucfirst(mb_strtolower($dto->lastName)),
            GenderEnum::from($dto->gender),
            $dto->phone,
            mb_strtolower($dto->email),
            sprintf('%s-%s-%s', $dto->firstName, $dto->lastName, random_int(100, 999)),
            LanguageEnum::Polish,
            CountryEnum::from($dto->country),
            ThemeEnum::Light,
            ColorEnum::Blue,
            file_get_contents(__DIR__ . '/../../public/profile.webp'),
            file_get_contents(__DIR__ . '/../../public/background.webp'),
            sprintf('%s %s bio', $dto->firstName, $dto->lastName),
            UserStatusEnum::Pending,
        );

        $user->password = $this->hasher->hashPassword($user, $dto->password);

        $this->userRepository->save($user);

        foreach ($dto->roles as $role) {
            $role = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->save($role);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->save($userRegister);

        $this->registerService->sendEmail($user, $userRegister);

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function update(Uuid $userId, UserUpdateDto $dto): Uuid
    {
        if (! $this->authorizationChecker->isGranted(UserRoleVoter::ASSIGN_ADMIN_ROLE, $dto)) {
            throw new ValidatorException('Role not allowed for this user.');
        }

        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        $user->birthAt = new DateTimeImmutable($dto->birthAt);
        $user->firstName = mb_ucfirst(mb_strtolower($dto->firstName));
        $user->lastName = mb_ucfirst(mb_strtolower($dto->lastName));
        $user->gender = GenderEnum::from($dto->gender);
        $user->phone = $dto->phone;
        $user->email = mb_strtolower($dto->email);
        $user->link = $dto->link;
        $user->language = LanguageEnum::from($dto->language);
        $user->country = CountryEnum::from($dto->country);
        $user->theme = ThemeEnum::from($dto->theme);
        $user->color = ColorEnum::from($dto->color);
        $user->profilePhoto = base64_decode($dto->profilePhoto, true);
        $user->backgroundPhoto = base64_decode($dto->backgroundPhoto, true);
        $user->bio = $dto->bio;

        if (! $dto->password) {
            $user->password = $this->hasher->hashPassword($user, $dto->password);
        }

        $currentRoles = array_map(fn (UserRole $role) => $role->role->value, $user->roles->toArray());
        $rolesToAdd = array_diff($dto->roles, $currentRoles);
        $rolesToRemove = array_diff($currentRoles, $dto->roles);

        foreach ($user->roles as $role) {
            if (in_array($role->role->value, $rolesToRemove, true)) {
                $role->softDelete();
                $this->userRoleRepository->save($role);
            }
        }

        foreach ($rolesToAdd as $role) {
            $roleEntity = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->save($roleEntity);
        }

        $currentDisciplines = array_map(
            fn (UserDiscipline $discipline) => $discipline->discipline->value,
            $user->disciplines->toArray(),
        );
        $disciplinesToAdd = array_diff($dto->disciplines ?? [], $currentDisciplines);
        $disciplinesToRemove = array_diff($currentDisciplines, $dto->disciplines ?? []);

        foreach ($user->disciplines as $discipline) {
            if (in_array($discipline->discipline->value, $disciplinesToRemove, true)) {
                $discipline->softDelete();
                $this->userDisciplineRepository->save($discipline);
            }
        }

        foreach ($disciplinesToAdd as $discipline) {
            $disciplineEntity = new UserDiscipline($user, DisciplineEnum::from($discipline));
            $this->userDisciplineRepository->save($disciplineEntity);
        }

        $this->userRepository->save($user);

        return $user->id;
    }

    final public function updateStatus(Uuid $userId, UserUpdateStatusDto $dto): Uuid
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        $user->status = UserStatusEnum::from($dto->status);
        $this->userRepository->save($user);

        return $user->id;
    }

    final public function delete(Uuid $userId): Uuid
    {
        $user = $this->userRepository->findById($userId);
        $user->softDelete();
        $this->userRepository->save($user);

        return $user->id;
    }

    final public function index(UserIndexDto $dto): array
    {
        return $this->userRepository->findUsers($dto);
    }

    final public function details(Uuid $userId, UserDetailsQueryDto $dto): User
    {
        if ($dto->include === $dto::USER_DISCIPLINES) {
            $user = $this->userRepository->findWithDisciplines($userId);
        } else {
            $user = $this->userRepository->findById($userId);
        }

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        return $user;
    }
}
