<?php

namespace App\Service;

use App\Dto\{UserCodeDto, UserSignDto};
use App\Entity\{User, UserSign};
use App\Enum\{UnauthorizedStatusEnum, UserStatusEnum};
use App\Repository\{UserRegisterRepository, UserRepository, UserSignRepository};
use DateTimeImmutable;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Random\RandomException;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;
use Symfony\Contracts\Translation\TranslatorInterface;

readonly class SignService
{
    public function __construct(
        private UserRepository $userRepository,
        private UserRegisterRepository $userRegisterRepository,
        private UserSignRepository $userSignRepository,
        private UserPasswordHasherInterface $hasher,
        private EmailService $emailService,
        private TranslatorInterface $translator,
        private JWTTokenManagerInterface $jwtManager,
    ) {
    }

    /**
     * @throws ValidatorException
     * @throws RandomException
     * @throws TransportExceptionInterface
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
            throw new ValidatorException('User account not confirmed.');
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

        $this->sendEmail($user, $userSign);

        return $userSign->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function confirm(Uuid $userSignId, UserCodeDto $dto): string
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
    final public function resend(Uuid $userSignId): Uuid
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

        $user = $userSign->user;

        $this->sendEmail($user, $userSign);

        return $userSign->id;
    }

    /**
     * @throws ValidatorException
     */
    final public function refresh(Uuid $userSignId): string
    {
        $userSign = $this->userSignRepository->findById($userSignId);

        if (! $userSign) {
            throw new ValidatorException('User sign not found.');
        }

        if ($userSign->status !== UnauthorizedStatusEnum::Correct) {
            throw new ValidatorException('Sign not confirmed.');
        }

        $user = $userSign->user;

        if ($user->status === UserStatusEnum::Banned) {
            throw new ValidatorException('User is banned.');
        }

        return $this->jwtManager->create($user);
    }

    private function sendEmail(User $user, UserSign $userSign): void
    {
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
    }
}
