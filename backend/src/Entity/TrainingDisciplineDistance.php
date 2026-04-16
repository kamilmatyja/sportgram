<?php

namespace App\Entity;

use DateTimeImmutable;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity]
#[ORM\Table(name: 'training_discipline_distances')]
#[ORM\HasLifecycleCallbacks]
class TrainingDisciplineDistance
{
    #[ORM\Id]
    #[ORM\Column(type: 'uuid', unique: true)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator('doctrine.uuid_generator')]
    private ?Uuid $id = null;

    #[ORM\ManyToOne(targetEntity: TrainingDiscipline::class)]
    #[ORM\JoinColumn(name: 'training_discipline_id', referencedColumnName: 'id', nullable: false)]
    private TrainingDiscipline $trainingDiscipline;

    #[ORM\Column(name: 'created_at', type: 'datetime_immutable')]
    private DateTimeImmutable $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime_immutable')]
    private DateTimeImmutable $updatedAt;

    #[ORM\Column(name: 'deleted_at', type: 'datetime_immutable', nullable: true)]
    private ?DateTimeImmutable $deletedAt = null;

    #[ORM\Column(name: 'distance', type: 'integer')]
    private int $distance;

    #[ORM\Column(name: 'time', type: 'integer')]
    private int $time;

    public function __construct(TrainingDiscipline $trainingDiscipline, int $distance, int $time)
    {
        $this->trainingDiscipline = $trainingDiscipline;
        $this->distance = $distance;
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

    public function getTrainingDiscipline(): TrainingDiscipline
    {
        return $this->trainingDiscipline;
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

    public function getDistance(): int
    {
        return $this->distance;
    }

    public function getTime(): int
    {
        return $this->time;
    }
}
