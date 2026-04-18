<?php

namespace App\Service;

use App\Dto\{UserCodeDto, UserEmailDto};
use App\Entity\{User, UserRegister};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Repository\{UserRegisterRepository, UserRepository};
use DateTimeImmutable;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class RegisterService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRegisterRepository $userRegisterRepository,
        private EmailService $emailService,
        private TranslatorInterface $translator,
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
    final public function confirm(Uuid $userRegisterId, UserCodeDto $dto): Uuid
    {
        $userRegister = $this->userRegisterRepository->findById($userRegisterId);

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
    final public function resend(Uuid $userRegisterId): Uuid
    {
        $userRegister = $this->userRegisterRepository->findById($userRegisterId);

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

        $this->sendEmail($user, $userRegister);

        return $userRegister->id;
    }

    final public function sendEmail(User $user, UserRegister $userRegister): void
    {
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
    }
}
