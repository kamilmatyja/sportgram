export const GenderEnum = {
    MALE: 1,
    FEMALE: 2,
    getOptions: (t) => [
        ...Object.entries(GenderEnum)
            .filter(([key]) => key !== 'getOptions')
            .map(([key, value]) => ({ value, label: t(`genders.${key.toLowerCase()}`) }))
    ]
};