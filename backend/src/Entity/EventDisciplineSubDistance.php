<?php

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'event_discipline_sub_distances')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineSubDistance
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;
    #[ORM\ManyToOne(targetEntity: EventDisciplineDistance::class)]
    #[ORM\JoinColumn(name: 'event_discipline_distance_id', referencedColumnName: 'id', nullable: false)]
    private EventDisciplineDistance $eventDisciplineDistance;
    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;
    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;
    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;
    #[ORM\Column(name: 'sub_distance', type: 'integer')]
    private int $subDistance;

    public function __construct(EventDisciplineDistance $eventDisciplineDistance, int $subDistance)
    {
        $this->eventDisciplineDistance = $eventDisciplineDistance;
        $this->subDistance = $subDistance;
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
