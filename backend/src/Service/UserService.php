<?php

namespace App\Service;

use App\Dto\UserCreateDto;
use App\Entity\User;
use App\Entity\UserRegister;
use App\Entity\UserRole;
use App\Enum\ColorEnum;
use App\Enum\CountryEnum;
use App\Enum\GenderEnum;
use App\Enum\LanguageEnum;
use App\Enum\RoleEnum;
use App\Enum\ThemeEnum;
use App\Enum\UnauthorizedStatusEnum;
use App\Enum\UserStatusEnum;
use App\Repository\UserRegisterRepository;
use App\Repository\UserRepository;
use App\Repository\UserRoleRepository;
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
        private TranslatorInterface $translator
    )
    {
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
            UserStatusEnum::Pending
        );

        $user->setPassword(
            $this->hasher->hashPassword($user, $dto->password)
        );

        $this->userRepository->add($user);

        foreach ($dto->roles as $role) {
            $role = new UserRole($user, RoleEnum::from($role));
            $this->userRoleRepository->add($role);
        }

        $userRegister = new UserRegister($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userRegisterRepository->add($userRegister);

        $locale = $user->getLanguage()->getLocale();
        $subject = $this->translator->trans('registration.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'registration.code.body',
            ['%code%' => $userRegister->getCode()],
            locale: $locale
        );
        $this->emailService->send($user->getEmail(), $subject, $body);

        return $user->getId();
    }
}
