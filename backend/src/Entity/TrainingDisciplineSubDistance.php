<?php

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'training_discipline_sub_distances')]
#[ORM\HasLifecycleCallbacks]
class TrainingDisciplineSubDistance
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: TrainingDisciplineDistance::class)]
    #[ORM\JoinColumn(name: 'training_discipline_distance_id', referencedColumnName: 'id', nullable: false)]
    private TrainingDisciplineDistance $trainingDisciplineDistance;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'sub_distance', type: 'integer')]
    private int $subDistance;

    #[ORM\Column(name: 'time', type: 'integer')]
    private int $time;

    #[ORM\Column(name: 'lat', type: 'integer', nullable: true)]
    private ?int $lat = null;

    #[ORM\Column(name: 'lng', type: 'integer', nullable: true)]
    private ?int $lng = null;

    #[ORM\Column(name: 'accuracy', type: 'integer', nullable: true)]
    private ?int $accuracy = null;

    #[ORM\Column(name: 'speed', type: 'integer', nullable: true)]
    private ?int $speed = null;

    public function __construct(
        TrainingDisciplineDistance $trainingDisciplineDistance,
        int $subDistance,
        int $time,
        ?int $lat,
        ?int $lng,
        ?int $accuracy,
        ?int $speed,
    ) {
        $this->trainingDisciplineDistance = $trainingDisciplineDistance;
        $this->subDistance = $subDistance;
        $this->time = $time;
        $this->lat = $lat;
        $this->lng = $lng;
        $this->accuracy = $accuracy;
        $this->speed = $speed;
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

    public function getTrainingDisciplineDistance(): TrainingDisciplineDistance
    {
        return $this->trainingDisciplineDistance;
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

    public function getSubDistance(): int
    {
        return $this->subDistance;
    }

    public function getTime(): int
    {
        return $this->time;
    }

    public function getLat(): ?int
    {
        return $this->lat;
    }

    public function getLng(): ?int
    {
        return $this->lng;
    }

    public function getAccuracy(): ?int
    {
        return $this->accuracy;
    }

    public function getSpeed(): ?int
    {
        return $this->speed;
    }
}
