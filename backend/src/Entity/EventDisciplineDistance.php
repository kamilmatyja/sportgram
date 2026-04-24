<?php

namespace App\Entity;

use App\Repository\EventDisciplineDistanceRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection, Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineDistanceRepository::class)]
#[ORM\Table(name: 'event_discipline_distances')]
#[ORM\HasLifecycleCallbacks]
class EventDisciplineDistance
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

    #[ORM\ManyToOne(targetEntity: EventDiscipline::class, inversedBy: 'distances')]
    #[ORM\JoinColumn(name: 'event_discipline_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public EventDiscipline $eventDiscipline {
        get {
            return $this->eventDiscipline;
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

    #[ORM\Column(name: 'distance', type: 'integer')]
    public int $distance {
        get {
            return $this->distance;
        }
    }

    /** @var EventDisciplineSubDistance[] */
    #[ORM\OneToMany(targetEntity: EventDisciplineSubDistance::class, mappedBy: 'eventDisciplineDistance')]
    public Collection $subDistances;

    /** @var EventDisciplineList[] */
    #[ORM\OneToMany(targetEntity: EventDisciplineList::class, mappedBy: 'eventDisciplineDistance')]
    public Collection $lists;

    public function __construct(EventDiscipline $eventDiscipline, int $distance)
    {
        $this->eventDiscipline = $eventDiscipline;
        $this->distance = $distance;
        $this->subDistances = new ArrayCollection();
        $this->lists = new ArrayCollection();
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
