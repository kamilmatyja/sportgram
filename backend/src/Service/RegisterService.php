<?php

namespace App\Service;

use App\Dto\{UserCodeDto, UserEmailDto};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Event\UserRegisterEmailEvent;
use App\Exception\SaveValidationException;
use App\Repository\{UserRegisterRepository, UserRepository};
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class RegisterService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRegisterRepository $userRegisterRepository,
        private EventDispatcherInterface $eventDispatcher,
    ) {
    }

    /**
     * @throws ValidatorException
     */
    final public function register(UserEmailDto $dto): Uuid
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        $userRegister = $this->userRegisterRepository->findLastByUserId($user->id);

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userRegister
            && $userRegister->attempt >= 3
            && $userRegister->status === UnauthorizedStatusEnum::Incorrect) {
            throw new ValidatorException('Too many attempts.');
        }

        return $userRegister->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function confirm(Uuid $userRegisterId, UserCodeDto $dto): Uuid
    {
        $userRegister = $this->userRegisterRepository->findById($userRegisterId);

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userRegister->attempt >= 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $userRegister->attempt += 1;

        if ($userRegister->code !== $dto->code) {
            $userRegister->status = UnauthorizedStatusEnum::Incorrect;
            $this->userRegisterRepository->save($userRegister);

            throw new SaveValidationException('Invalid code.');
        }

        $userRegister->status = UnauthorizedStatusEnum::Correct;
        $this->userRegisterRepository->save($userRegister);

        return $userRegister->id;
    }

    final public function resend(Uuid $userRegisterId): Uuid
    {
        $userRegister = $this->userRegisterRepository->findById($userRegisterId);

        if ($userRegister->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userRegister->attempt >= 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $user = $userRegister->user;

        $this->eventDispatcher->dispatch(new UserRegisterEmailEvent($user, $userRegister));

        return $userRegister->id;
    }
}
