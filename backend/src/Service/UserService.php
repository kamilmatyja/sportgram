<?php

namespace App\Service;

use App\Dto\{UserCreateNanoDto,
    UserDto,
    UserListDto,
    UserRegisterConfirmDto,
    UserRegisterDto,
    UserSignConfirmDto,
    UserSignDto,
    UserUpdateStatusDto};
use App\Entity\{User, UserDiscipline, UserRegister, UserRole, UserSign};
use App\Enum\{ColorEnum,
    CountryEnum,
    DisciplineEnum,
    GenderEnum,
    LanguageEnum,
    RoleEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Repository\{UserDisciplineRepository,
    UserRegisterRepository,
    UserRepository,
    UserRoleRepository,
    UserSignRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRoleRepository $userRoleRepository,
        private UserDisciplineRepository $userDisciplineRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserSignRepository $userSignRepository,
        private UserPasswordHasherInterface $hasher,
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private JWTTokenManagerInterface $jwtManager,
        private AuthorizationCheckerInterface $authorizationChecker,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function createUser(UserDto $dto): Uuid
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

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('register.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'register.code.body',
            ['%code%' => $userRegister->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userRegister->status = UnauthorizedStatusEnum::Sent;
            $this->userRegisterRepository->save($userRegister);
        }

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function createUserNano(UserCreateNanoDto $dto): Uuid
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

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('register.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'register.code.body',
            ['%code%' => $userRegister->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userRegister->status = UnauthorizedStatusEnum::Sent;
            $this->userRegisterRepository->save($userRegister);
        }

        return $user->id;
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function updateUser(string $id, UserDto $dto): Uuid
    {
        if (! $this->authorizationChecker->isGranted(RoleEnum::ROLE_ADMINISTRATOR) && in_array(
            RoleEnum::ROLE_ADMINISTRATOR,
            $dto->roles,
            true,
        )) {
            throw new ValidatorException('Role not allowed for this user.');
        }

        $user = $this->userRepository->findById($id);

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

        if (! empty($dto->password)) {
            $user->password = $this->hasher->hashPassword($user, $dto->password);
        }

        /** @var UserRole $role */
        foreach ($user->roles as $role) {
            if (in_array($role->role->value, $dto->roles, true)) {
                unset($dto->roles[array_search($role->role->value, $dto->roles)]);
            } else {
                $role->softDelete();
                $this->userRoleRepository->save($role);
            }
        }

        /** @var int $role */
        foreach ($dto->roles as $role) {
            $roleEntity = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->save($roleEntity);
        }

        /** @var UserDiscipline $discipline */
        foreach ($user->disciplines as $discipline) {
            if (in_array($discipline->discipline->value, $dto->disciplines, true)) {
                unset($dto->disciplines[array_search($discipline->discipline->value, $dto->disciplines)]);
            } else {
                $discipline->softDelete();
                $this->userDisciplineRepository->save($discipline);
            }
        }

        /** @var int $discipline */
        foreach ($dto->disciplines ?? [] as $discipline) {
            $disciplineEntity = new UserDiscipline($user, DisciplineEnum::from($discipline));
            $this->userDisciplineRepository->save($disciplineEntity);
        }

        $this->userRepository->save($user);

        return $user->id;
    }

    final public function updateUserStatus(string $id, UserUpdateStatusDto $dto): Uuid
    {
        $user = $this->userRepository->findById($id);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        $user->status = UserStatusEnum::from($dto->status);
        $this->userRepository->save($user);

        return $user->id;
    }

    final public function deleteUser(string $userId): Uuid
    {
        $user = $this->userRepository->findById($userId);
        $user->softDelete();
        $this->userRepository->save($user);

        return $user->id;
    }

    final public function listUsers(UserListDto $dto): array
    {
        return $this->userRepository->findUsers($dto);
    }

    final public function detailsUser(string $userId): User
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        return $user;
    }

    /**
     * @throws ValidatorException
     */
    final public function registerUser(UserRegisterDto $dto): Uuid
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        $userRegister = $this->userSignRepository->findLastByUserId($user->id);

        if ($userRegister
            && $userRegister->attempt >= 3
            && $userRegister->status === UnauthorizedStatusEnum::Incorrect
            && $userRegister->updatedAt->diff(new DateTimeImmutable())->days < 1) {
            throw new ValidatorException('Too many attempts.');
        }

        return $userRegister->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function registerUserConfirm(string $id, UserRegisterConfirmDto $dto): Uuid
    {
        $userRegister = $this->userRegisterRepository->findLastByUserId($id);

        if (! $userRegister) {
            throw new ValidatorException('User register not found.');
        }

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userRegister->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $userRegister->attempt += 1;

        if ($userRegister->code !== $dto->code) {
            $userRegister->status = UnauthorizedStatusEnum::Incorrect;
            $this->userRegisterRepository->save($userRegister);

            throw new ValidatorException('Invalid code.');
        }

        $userRegister->status = UnauthorizedStatusEnum::Correct;
        $this->userRegisterRepository->save($userRegister);

        return $userRegister->id;
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function registerUserResend(string $id): Uuid
    {
        $userRegister = $this->userRegisterRepository->findLastByUserId($id);

        if (! $userRegister) {
            throw new ValidatorException('User register not found.');
        }

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userRegister->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $user = $userRegister->user;

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('register.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'register.code.body',
            ['%code%' => $userRegister->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userRegister->status = UnauthorizedStatusEnum::Sent;
            $this->userRegisterRepository->save($userRegister);
        }

        return $userRegister->id;
    }

    /**
     * @throws ValidatorException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function signUser(UserSignDto $dto): Uuid
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        if (! $this->hasher->isPasswordValid($user, $dto->password)) {
            throw new ValidatorException('Invalid password.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        $userRegister = $this->userRegisterRepository->findLastByUserId($user->id);

        if (! $userRegister || $userRegister->status !== UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('User account not confirmed.');
        }

        $oldUserSign = $this->userSignRepository->findLastByUserId($user->id);

        if ($oldUserSign
            && $oldUserSign->attempt >= 3
            && $oldUserSign->status === UnauthorizedStatusEnum::Incorrect
            && $oldUserSign->updatedAt->diff(new DateTimeImmutable())->days < 1) {
            throw new ValidatorException('Too many attempts.');
        }

        $userSign = new UserSign($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userSignRepository->save($userSign);

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('sign.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'sign.code.body',
            ['%code%' => $userSign->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userSign->status = UnauthorizedStatusEnum::Sent;
            $this->userSignRepository->save($userSign);
        }

        return $userSign->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function signUserConfirm(string $userSignId, UserSignConfirmDto $dto): string
    {
        $userSign = $this->userSignRepository->findById($userSignId);

        if (! $userSign) {
            throw new ValidatorException('User sign not found.');
        }

        if ($userSign->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userSign->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $userSign->attempt += 1;

        if ($userSign->code !== $dto->code) {
            $userSign->status = UnauthorizedStatusEnum::Incorrect;
            $this->userSignRepository->save($userSign);

            throw new ValidatorException('Invalid code.');
        }

        $userSign->status = UnauthorizedStatusEnum::Correct;
        $this->userSignRepository->save($userSign);

        $user = $userSign->user;

        return $this->jwtManager->create($user);
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function signUserResend(string $id): Uuid
    {
        $userSign = $this->userSignRepository->findLastByUserId($id);

        if (! $userSign) {
            throw new ValidatorException('User sign not found.');
        }

        if ($userSign->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userSign->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $user = $userSign->user;

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('sign.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'sign.code.body',
            ['%code%' => $userSign->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userSign->status = UnauthorizedStatusEnum::Sent;
            $this->userSignRepository->save($userSign);
        }

        return $userSign->id;
    }
}
