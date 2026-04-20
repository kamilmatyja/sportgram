<?php

namespace App\Service;

use App\Dto\{PushSubscriptionDto, PushSubscriptionIndexDto};
use App\Entity\{PushSubscription, User};
use App\Enum\PushSubscriptionStatusEnum;
use App\Repository\PushSubscriptionRepository;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Exception\ValidatorException;

readonly class PushSubscriptionService
{
    public function __construct(
        private PushSubscriptionRepository $pushSubscriptionRepository,
        private Security $security,
    ) {
    }

    final public function create(PushSubscriptionDto $dto): Uuid
    {
        /** @var User $user */
        $user = $this->security->getUser();

        $pushSubscription = new PushSubscription(
            $user,
            $dto->endpoint,
            $dto->p256dh,
            $dto->auth,
            $dto->userAgent,
            PushSubscriptionStatusEnum::from($dto->status),
        );

        $this->pushSubscriptionRepository->save($pushSubscription);

        return $pushSubscription->id;
    }

    final public function update(Uuid $pushSubscriptionId, PushSubscriptionDto $dto): Uuid
    {
        $pushSubscription = $this->pushSubscriptionRepository->findById($pushSubscriptionId);

        if (! $pushSubscription) {
            throw new ValidatorException('Push subscription not found.');
        }

        $pushSubscription->endpoint = $dto->endpoint;
        $pushSubscription->p256dh = $dto->p256dh;
        $pushSubscription->auth = $dto->auth;
        $pushSubscription->status = PushSubscriptionStatusEnum::from($dto->status);
        $this->pushSubscriptionRepository->save($pushSubscription);

        return $pushSubscription->id;
    }

    final public function delete(Uuid $id): Uuid
    {
        $pushSubscription = $this->pushSubscriptionRepository->findById($id);

        if (! $pushSubscription) {
            throw new ValidatorException('Push subscription not found.');
        }

        $pushSubscription->softDelete();
        $this->pushSubscriptionRepository->save($pushSubscription);

        return $pushSubscription->id;
    }

    final public function index(PushSubscriptionIndexDto $dto): array
    {
        /** @var User $user */
        $user = $this->security->getUser();

        return $this->pushSubscriptionRepository->findPushSubscriptions($user->id, $dto);
    }

    final public function details(Uuid $pushSubscriptionId): PushSubscription
    {
        $pushSubscription = $this->pushSubscriptionRepository->findById($pushSubscriptionId);

        if (! $pushSubscription) {
            throw new ValidatorException('Push subscription not found.');
        }

        return $pushSubscription;
    }
}
