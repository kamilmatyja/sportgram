<?php

namespace App\Entity;

use App\Enum\PushSubscriptionStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'push_subscriptions')]
#[ORM\HasLifecycleCallbacks]
class PushSubscription
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'endpoint', type: 'text', length: 2048)]
    private string $endpoint;

    #[ORM\Column(name: 'p256dh', length: 256)]
    private string $p256dh;

    #[ORM\Column(name: 'auth', length: 256)]
    private string $auth;

    #[ORM\Column(name: 'user_agent', type: 'text', length: 1024, nullable: true)]
    private ?string $userAgent = null;

    #[ORM\Column(name: 'status', type: 'integer', enumType: PushSubscriptionStatusEnum::class)]
    private PushSubscriptionStatusEnum $status;

    public function __construct(
        User $user,
        string $endpoint,
        string $p256dh,
        string $auth,
        ?string $userAgent,
        PushSubscriptionStatusEnum $status,
    ) {
        $this->user = $user;
        $this->endpoint = $endpoint;
        $this->p256dh = $p256dh;
        $this->auth = $auth;
        $this->userAgent = $userAgent;
        $this->status = $status;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function getEndpoint(): string
    {
        return $this->endpoint;
    }

    public function getP256dh(): string
    {
        return $this->p256dh;
    }

    public function getAuth(): string
    {
        return $this->auth;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function getStatus(): PushSubscriptionStatusEnum
    {
        return $this->status;
    }
}
