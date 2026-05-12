export const RoleEnum = {
    PARTICIPANT: 1,
    ORGANIZER: 2,
    ADMINISTRATOR: 3,
    getNanoOptions: (t) => [
        { value: 1, label: t('roles.participant') },
        { value: 2, label: t('roles.organizer') },
    ]
};
