export class TrainingDisciplineSubDistanceResponse {
    id!: string;
    trainingDisciplineDistanceId!: string;
    createdAt!: string;
    updatedAt!: string;
    subDistance!: number;
    time!: number;
    lat!: number | null;
    lng!: number | null;
    accuracy!: number | null;
    speed!: number | null;
}