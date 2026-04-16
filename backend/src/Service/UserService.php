<?php

namespace App\Service;

use App\Dto\UserCreateDto;
use App\Entity\{User, UserRegister, UserRole};
use App\Enum\{ColorEnum,
    CountryEnum,
    GenderEnum,
    LanguageEnum,
    RoleEnum,
    ThemeEnum,
    UnauthorizedStatusEnum,
    UserStatusEnum};
use App\Repository\{UserRegisterRepository, UserRepository, UserRoleRepository};
use DateMalformedStringException;
use DateTimeImmutable;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class UserService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRoleRepository $userRoleRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserPasswordHasherInterface $hasher,
        private EmailService $emailService,
        private TranslatorInterface $translator,
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

        $this->userRepository->add($user);

        foreach ($dto->roles as $role) {
            $role = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->add($role);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->add($userRegister);

        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('registration.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'registration.code.body',
            ['%code%' => $userRegister->code],
            locale: $locale,
        );
        $this->emailService->send($user->email, $subject, $body);

        return $user->id;
    }
}
