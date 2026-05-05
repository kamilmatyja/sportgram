<?php

namespace App\Entity;

use App\Enum\DisciplineEnum;
use App\Repository\EventDisciplineRepository;
use DateTimeImmutable;
use Doctrine\Common\Collections\{ArrayCollection,Collection};
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: EventDisciplineRepository::class)]
#[ORM\Table(name: 'event_disciplines')]
#[ORM\HasLifecycleCallbacks]
class EventDiscipline
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

    #[ORM\ManyToOne(targetEntity: Event::class, cascade: ['persist'], inversedBy: 'disciplines')]
    #[ORM\JoinColumn(name: 'event_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    public Event $event {
        get {
            return $this->event;
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

    #[ORM\Column(name: 'discipline', type: 'integer', enumType: DisciplineEnum::class)]
    public DisciplineEnum $discipline {
        get {
            return $this->discipline;
        }
    }

    /** @var EventDisciplineDistance[] */
    #[ORM\OneToMany(targetEntity: EventDisciplineDistance::class, mappedBy: 'eventDiscipline')]
    public Collection $distances;

    public function __construct(Event $event, DisciplineEnum $discipline)
    {
        $this->event = $event;
        $this->discipline = $discipline;
        $this->distances = new ArrayCollection();
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
