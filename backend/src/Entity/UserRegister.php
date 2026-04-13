<?php

namespace App\Entity;

use App\Enum\UnauthorizedStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'user_registers')]
#[ORM\HasLifecycleCallbacks]
class UserRegister
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
    #[ORM\Column(name: 'code', type: 'integer', length: 6)]
    private int $code;
    #[ORM\Column(name: 'attempt', type: 'integer', length: 4)]
    private int $attempt;
    #[ORM\Column(name: 'status', type: 'integer', enumType: UnauthorizedStatusEnum::class)]
    private UnauthorizedStatusEnum $status;

    public function __construct(
        User $user,
        string $code,
        int $attempt,
        UnauthorizedStatusEnum $status,
    ) {
        $this->user = $user;
        $this->code = $code;
        $this->attempt = $attempt;
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
}
