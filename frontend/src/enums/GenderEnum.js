export const GenderEnum = {
    MALE: 1,
    FEMALE: 2,
    getLabel: (value, t) => t(`gender.${value}`)
};