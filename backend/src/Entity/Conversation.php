<?php

namespace App\Entity;

use App\Enum\ConversationStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'conversations')]
#[ORM\HasLifecycleCallbacks]
class Conversation
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'sender_user_id', referencedColumnName: 'id', nullable: false)]
    private User $senderUser;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'receiver_user_id', referencedColumnName: 'id', nullable: false)]
    private User $receiverUser;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'text', type: 'text', length: 2048)]
    private string $text;

    #[ORM\Column(name: 'status', type: 'integer', enumType: ConversationStatusEnum::class)]
    private ConversationStatusEnum $status;

    public function __construct(User $senderUser, User $receiverUser, string $text, ConversationStatusEnum $status)
    {
        $this->senderUser = $senderUser;
        $this->receiverUser = $receiverUser;
        $this->text = $text;
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

    public function getSenderUser(): User
    {
        return $this->senderUser;
    }

    public function getReceiverUser(): User
    {
        return $this->receiverUser;
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

    public function getText(): string
    {
        return $this->text;
    }

    public function getStatus(): ConversationStatusEnum
    {
        return $this->status;
    }
}
