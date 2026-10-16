<?php

namespace App\Service;

use App\Dto\{UserCodeDto, UserSignDto};
use App\Entity\{User, UserSign};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Event\UserSignEmailEvent;
use App\Exception\SaveValidationException;
use App\Repository\{UserRegisterRepository, UserRepository, UserSignRepository};
use DateInterval;
use DateTimeImmutable;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Random\RandomException;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class SignService
{
    private const string SIGN_LIFETIME = 'P30D';

    public function __construct(
        private UserRepository $userRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserSignRepository $userSignRepository,
        private UserPasswordHasherInterface $hasher,
        private JWTTokenManagerInterface $jwtManager,
        private EventDispatcherInterface $eventDispatcher,
        private Security $security,
    ) {
    }

    /**
     * @throws ValidatorException
     * @throws RandomException
     */
    final public function sign(UserSignDto $dto): Uuid
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
            throw new ValidatorException('User account is not confirmed.');
        }

        $latestUserSign = $this->userSignRepository->findLastByUserId($user->id);

        if ($latestUserSign
            && $latestUserSign->attempt >= 3
            && $latestUserSign->status === UnauthorizedStatusEnum::Incorrect
            && $latestUserSign->updatedAt->diff(new DateTimeImmutable())->days < 1) {
            throw new ValidatorException('Too many attempts.');
        }

        $userSign = new UserSign($user, random_int(100000, 999999), 0, UnauthorizedStatusEnum::NotSent);
        $this->userSignRepository->save($userSign);

        $this->eventDispatcher->dispatch(new UserSignEmailEvent($user, $userSign));

        return $userSign->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function confirm(Uuid $userSignId, UserCodeDto $dto): string
    {
        $userSign = $this->userSignRepository->findById($userSignId);

        if ($userSign->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userSign->attempt >= 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $userSign->attempt += 1;

        if ($userSign->code !== $dto->code) {
            $userSign->status = UnauthorizedStatusEnum::Incorrect;
            $this->userSignRepository->save($userSign);

            throw new SaveValidationException('Invalid code.');
        }

        $userSign->status = UnauthorizedStatusEnum::Correct;
        $this->userSignRepository->save($userSign);

        $user = $userSign->user;

        return $this->jwtManager->create($user);
    }

    final public function resend(Uuid $userSignId): Uuid
    {
        $userSign = $this->userSignRepository->findById($userSignId);

        if ($userSign->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userSign->attempt >= 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $user = $userSign->user;

        $this->eventDispatcher->dispatch(new UserSignEmailEvent($user, $userSign));

        return $userSign->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function refresh(Uuid $userSignId): string
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $userSign = $this->userSignRepository->findById($userSignId);

        if (! $userSign->user->id->equals($user->id)) {
            throw new ValidatorException('User not equal to sign.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        if ($userSign->status !== UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Sign not confirmed.');
        }

        if ($userSign->updatedAt->add(new DateInterval(self::SIGN_LIFETIME)) < new DateTimeImmutable()) {
            throw new ValidatorException('Sign expired.');
        }

        return $this->jwtManager->create($user);
    }
}
