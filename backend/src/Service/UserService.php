<?php

namespace App\Service;

use App\Dto\UserCreateDto;
use App\Entity\User;
use App\Enum\ColorEnum;
use App\Enum\CountryEnum;
use App\Enum\GenderEnum;
use App\Enum\LanguageEnum;
use App\Enum\ThemeEnum;
use App\Enum\UserStatusEnum;
use App\Repository\UserRepository;
use DateMalformedStringException;
use DateTimeImmutable;
use Symfony\Component\Uid\Uuid;

readonly class UserService
{
    public function __construct(private UserRepository $userRepository)
    {
    }

    /**
     * @throws DateMalformedStringException
     */
    final public function createUser(UserCreateDto $dto): Uuid
    {
        $user = new User(
            new DateTimeImmutable($dto->birthAt),
            $dto->firstName,
            $dto->lastName,
            GenderEnum::from($dto->gender),
            (int)$dto->phone,
            $dto->email,
            password_hash($dto->password, PASSWORD_BCRYPT),
            $dto->link,
            LanguageEnum::from($dto->language),
            CountryEnum::from($dto->country),
            ThemeEnum::from($dto->theme),
            ColorEnum::from($dto->color),
            base64_decode($dto->profilePhoto, true),
            base64_decode($dto->backgroundPhoto, true),
            $dto->bio,
            UserStatusEnum::Registered
        );
        $this->userRepository->add($user);
        return $user->getId();
    }
}

