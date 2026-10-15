import React from 'react';

import { DisciplineEnum } from '../enums/DisciplineEnum';

interface DistanceShape<S> {
    subDistances?: S[];
}

interface DisciplineShape<D> {
    discipline: number;
    distances?: D[];
}

const replaceAt = <T>(items: T[], index: number, patch: Partial<T>): T[] =>
    items.map((item, i) => (i === index ? { ...item, ...patch } : item));

const removeAt = <T>(items: T[], index: number): T[] => items.filter((_, i) => i !== index);

export function createDisciplinesEditor<F extends { disciplines: DisciplineShape<D>[] }, D extends DistanceShape<S>, S>(
    setFormData: React.Dispatch<React.SetStateAction<F>>,
    newDistance: () => D,
    newSubDistance: () => S,
) {
    const updateDisciplines = (update: (discs: DisciplineShape<D>[]) => DisciplineShape<D>[]) =>
        setFormData((prev) => ({ ...prev, disciplines: update(prev.disciplines || []) }));

    const updateDistances = (discIndex: number, update: (dists: D[]) => D[]) =>
        updateDisciplines((discs) =>
            discs.map((disc, i) => (i === discIndex ? { ...disc, distances: update(disc.distances || []) } : disc)),
        );

    const updateSubDistances = (discIndex: number, distIndex: number, update: (subs: S[]) => S[]) =>
        updateDistances(discIndex, (dists) =>
            dists.map((dist, i) =>
                i === distIndex ? { ...dist, subDistances: update(dist.subDistances || []) } : dist,
            ),
        );

    return {
        addDiscipline: () =>
            updateDisciplines((discs) => [...discs, { discipline: DisciplineEnum.RUNNING, distances: [] }]),
        updateDisciplineType: (index: number, discipline: number) =>
            updateDisciplines((discs) => replaceAt(discs, index, { discipline })),
        removeDiscipline: (index: number) => updateDisciplines((discs) => removeAt(discs, index)),

        addDistance: (discIndex: number) => updateDistances(discIndex, (dists) => [...dists, newDistance()]),
        updateDistance: (discIndex: number, distIndex: number, patch: Partial<D>) =>
            updateDistances(discIndex, (dists) => replaceAt(dists, distIndex, patch)),
        removeDistance: (discIndex: number, distIndex: number) =>
            updateDistances(discIndex, (dists) => removeAt(dists, distIndex)),

        addSubDistance: (discIndex: number, distIndex: number) =>
            updateSubDistances(discIndex, distIndex, (subs) => [...subs, newSubDistance()]),
        updateSubDistance: (discIndex: number, distIndex: number, subIndex: number, patch: Partial<S>) =>
            updateSubDistances(discIndex, distIndex, (subs) => replaceAt(subs, subIndex, patch)),
        removeSubDistance: (discIndex: number, distIndex: number, subIndex: number) =>
            updateSubDistances(discIndex, distIndex, (subs) => removeAt(subs, subIndex)),
    };
}
