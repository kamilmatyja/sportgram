<?php

namespace App\Entity;

use App\Repository\EventDisciplineSubDistanceRepository;
use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineSubDistanceRepository::class)]
#[ORM\Table(name: 'event_discipline_sub_distances')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineSubDistance
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

    #[ORM\ManyToOne(targetEntity: EventDisciplineDistance::class, inversedBy: 'subDistances')]
    #[ORM\JoinColumn(name: 'event_discipline_distance_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDisciplineDistance $eventDisciplineDistance {
        get {
            return $this->eventDisciplineDistance;
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

    #[ORM\Column(name: 'sub_distance', type: 'integer')]
    public int $subDistance {
        get {
            return $this->subDistance;
        }
    }

    public function __construct(EventDisciplineDistance $eventDisciplineDistance, int $subDistance)
    {
        $this->eventDisciplineDistance = $eventDisciplineDistance;
        $this->subDistance = $subDistance;
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
