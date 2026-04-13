<?php

namespace App\Entity;

use App\Enum\ElementStatusEnum;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'trainings')]
#[ORM\HasLifecycleCallbacks]
class Training
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: Feed::class)]
    #[ORM\JoinColumn(name: 'feed_id', referencedColumnName: 'id', nullable: false)]
    private Feed $feed;
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false)]
    private User $user;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'started_at', type: 'datetime_immutable')]
    private DateTimeImmutable $startedAt;
    #[ORM\Column(name: 'ended_at', type: 'datetime_immutable')]
    private DateTimeImmutable $endedAt;
    #[ORM\Column(name: 'title', type: 'text', length: 256)]
    private string $title;
    #[ORM\Column(name: 'description', type: 'text', length: 4096)]
    private string $description;
    #[ORM\Column(name: 'link', type: 'text', length: 2048)]
    private string $link;
    #[ORM\Column(name: 'location', type: 'text', length: 1024)]
    private string $location;
    #[ORM\Column(name: 'status', type: 'integer', enumType: ElementStatusEnum::class)]
    private ElementStatusEnum $status;

    public function __construct(
        Feed $feed,
        User $user,
        DateTimeImmutable $startedAt,
        DateTimeImmutable $endedAt,
        string $title,
        string $description,
        string $link,
        string $location,
        ElementStatusEnum $status,
    ) {
        $this->feed = $feed;
        $this->user = $user;
        $this->startedAt = $startedAt;
        $this->endedAt = $endedAt;
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->location = $location;
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

    public function getFeed(): Feed
    {
        return $this->feed;
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

    public function getStartedAt(): DateTimeImmutable
    {
        return $this->startedAt;
    }

    public function getEndedAt(): DateTimeImmutable
    {
        return $this->endedAt;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getLink(): string
    {
        return $this->link;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function getStatus(): ElementStatusEnum
    {
        return $this->status;
    }
}
