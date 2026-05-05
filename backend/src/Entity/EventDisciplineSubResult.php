<?php

namespace App\Entity;

use App\Repository\EventDisciplineSubResultRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineSubResultRepository::class)]
#[ORM\Table(name: 'event_discipline_sub_results')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineSubResult
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    public ?Uuid $id = null {
        get {
            return $this->id;
        }
    }

    #[ORM\ManyToOne(targetEntity: EventDisciplineSubDistance::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'event_discipline_sub_distance_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDisciplineSubDistance $eventDisciplineSubDistance {
        get {
            return $this->eventDisciplineSubDistance;
        }
    }

    #[ORM\ManyToOne(targetEntity: EventDisciplineResult::class, cascade: ['persist'], inversedBy: 'subResults')]
    #[ORM\JoinColumn(name: 'event_discipline_result_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDisciplineResult $eventDisciplineResult {
        get {
            return $this->eventDisciplineResult;
        }
    }

    #[ORM\ManyToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public User $user {
        get {
            return $this->user;
        }
    }

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    public DateTimeImmutable $createdAt {
        get {
            return $this->createdAt;
        }
    }

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    public DateTimeImmutable $updatedAt {
        get {
            return $this->updatedAt;
        }
    }

    #[ORM\Column(name: 'time', type: 'integer')]
    public int $time {
        get {
            return $this->time;
        }
    }

    public function __construct(
        EventDisciplineSubDistance $eventDisciplineSubDistance,
        EventDisciplineResult $eventDisciplineResult,
        User $user,
        int $time,
    ) {
        $this->eventDisciplineSubDistance = $eventDisciplineSubDistance;
        $this->eventDisciplineResult = $eventDisciplineResult;
        $this->user = $user;
        $this->time = $time;
    }

    #[ORM\PrePersist]
    final public function onPrePersist(): void
    {
        $now = new DateTimeImmutable();
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    final public function onPreUpdate(): void
    {
        $this->updatedAt = new DateTimeImmutable();
    }
}
