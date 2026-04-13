<?php

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'event_discipline_results')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineResult
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: EventDisciplineDistance::class)]
    #[ORM\JoinColumn(name: 'event_discipline_distance_id', referencedColumnName: 'id', nullable: false)]
    private EventDisciplineDistance $eventDisciplineDistance;
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
    #[ORM\Column(name: 'time', type: 'integer')]
    private int $time;

    public function __construct(EventDisciplineDistance $eventDisciplineDistance, Feed $feed, User $user, int $time)
    {
        $this->eventDisciplineDistance = $eventDisciplineDistance;
        $this->feed = $feed;
        $this->user = $user;
        $this->time = $time;
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

    public function getEventDisciplineDistance(): EventDisciplineDistance
    {
        return $this->eventDisciplineDistance;
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

    public function getTime(): int
    {
        return $this->time;
    }
}
