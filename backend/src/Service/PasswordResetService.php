<?php

namespace App\Service;

use App\Dto\{UserEmailDto, UserPasswordDto};
use App\Entity\{User, UserPasswordReset};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Repository\{UserPasswordResetRepository, UserRegisterRepository, UserRepository};
use DateTimeImmutable;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class PasswordResetService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserPasswordResetRepository $userPasswordResetRepository,
        private EmailService $emailService,
        private TranslatorInterface $translator,
    ) {
    }

    /**
     * @throws ValidatorException
     * @throws RandomException
     * @throws TransportExceptionInterface
     */
    final public function passwordReset(UserEmailDto $dto): Uuid
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (! $user) {
            throw new ValidatorException('User not found.');
        }

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        $userRegister = $this->userRegisterRepository->findLastByUserId($user->id);

        if (! $userRegister || $userRegister->status !== UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('User account not confirmed.');
        }

        $latestUserPasswordReset = $this->userPasswordResetRepository->findLastByUserId($user->id);

        if ($latestUserPasswordReset
            && $latestUserPasswordReset->attempt >= 3
            && $latestUserPasswordReset->status === UnauthorizedStatusEnum::Incorrect
            && $latestUserPasswordReset->updatedAt->diff(new DateTimeImmutable())->days < 1) {
            throw new ValidatorException('Too many attempts.');
        }

        $userPasswordReset = new UserPasswordReset(
            $user,
            random_int(100000, 999999),
            0,
            UnauthorizedStatusEnum::NotSent,
        );
        $this->userPasswordResetRepository->save($userPasswordReset);

        $this->sendEmail($user, $userPasswordReset);

        return $userPasswordReset->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function confirm(Uuid $userPasswordResetId, UserPasswordDto $dto): Uuid
    {
        $userPasswordReset = $this->userPasswordResetRepository->findById($userPasswordResetId);

        if (! $userPasswordReset) {
            throw new ValidatorException('User password reset not found.');
        }

        if ($userPasswordReset->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userPasswordReset->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $userPasswordReset->attempt += 1;

        if ($userPasswordReset->code !== $dto->code) {
            $userPasswordReset->status = UnauthorizedStatusEnum::Incorrect;
            $this->userPasswordResetRepository->save($userPasswordReset);

            throw new ValidatorException('Invalid code.');
        }

        $user = $userPasswordReset->user;
        $user->password = $dto->password;
        $this->userRepository->save($user);

        $userPasswordReset->status = UnauthorizedStatusEnum::Correct;
        $this->userPasswordResetRepository->save($userPasswordReset);

        return $userPasswordReset->id;
    }

    /**
     * @throws TransportExceptionInterface
     */
    final public function resend(Uuid $userPasswordResetId): Uuid
    {
        $userPasswordReset = $this->userPasswordResetRepository->findById($userPasswordResetId);

        if (! $userPasswordReset) {
            throw new ValidatorException('User password reset not found.');
        }

        if ($userPasswordReset->status === UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Code already used.');
        }

        if ($userPasswordReset->attempt > 3) {
            throw new ValidatorException('Too many attempts.');
        }

        $user = $userPasswordReset->user;

        $this->sendEmail($user, $userPasswordReset);

        return $userPasswordReset->id;
    }

    private function sendEmail(User $user, UserPasswordReset $userPasswordReset): void
    {
        $locale = $user->language->getLocale();
        $subject = $this->translator->trans('passwordReset.code.subject', locale: $locale);
        $body = $this->translator->trans(
            'passwordReset.code.body',
            ['%code%' => $userPasswordReset->code],
            locale: $locale,
        );

        try {
            $this->emailService->send($user->email, $subject, $body);
        } finally {
            $userPasswordReset->status = UnauthorizedStatusEnum::Sent;
            $this->userPasswordResetRepository->save($userPasswordReset);
        }
    }
}
