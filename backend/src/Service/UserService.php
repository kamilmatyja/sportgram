<?php

namespace App\Service;

use App\Dto\{UserCreateDto, UserRegisterConfirmDto, UserSignConfirmDto, UserSignDto};
use App\Entity\{User, UserRegister, UserRole, UserSign};
use App\Enum\{ColorEnum,
    CountryEnum,
    GenderEnum,
    LanguageEnum,
    RoleEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Repository\{UserRegisterRepository, UserRepository, UserRoleRepository, UserSignRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Lexik\Bundle\JWTAuthenticationBundle\Exception\JWTEncodeFailureException;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRoleRepository $userRoleRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserSignRepository $userSignRepository,
        private UserPasswordHasherInterface $hasher,
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private JWTTokenManagerInterface $jwtManager,
    ) {
    }

    /**
     * @throws DateMalformedStringException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function createUser(UserCreateDto $dto): Uuid
    {
        $user = new User(
            new DateTimeImmutable($dto->birthAt),
            $dto->firstName,
            $dto->lastName,
            GenderEnum::from($dto->gender),
            $dto->phone,
            $dto->email,
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
     * @throws ValidatorException
     */
    final public function registerUserConfirm(UserRegisterConfirmDto $dto): Uuid
    {
        $user = $this->userRepository->findOneByEmail($dto->email);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        $userRegister = $this->userRegisterRepository->findLastByUserId($user->id);

        if (! $userRegister) {
            throw new ValidatorException('User register not found.');
        }

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        $userRegister->attempt += 1;

        if ($userRegister->code !== $dto->code) {
            $userRegister->status = UnauthorizedStatusEnum::Incorrect;
            $this->userRegisterRepository->save($userRegister);

            throw new ValidatorException('Invalid code.');
        }

        $userRegister->status = UnauthorizedStatusEnum::Correct;
        $this->userRegisterRepository->save($userRegister);

        return $user->id;
    }

    /**
     * @throws ValidatorException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function signUser(UserSignDto $dto): Uuid
    {
        $user = $this->userRepository->findOneByEmail($dto->email);

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
     * @throws JWTEncodeFailureException
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
}
