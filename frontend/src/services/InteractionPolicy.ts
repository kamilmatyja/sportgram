export type InteractionSurface = 'page' | 'modal' | 'online' | 'confirmation' | 'navigation' | 'profile-navigation';

export function isTrainingsOrGoalsRoute(pathname: string): boolean {
    const routePath = pathname.split(/[?#]/, 1)[0];
    return /(?:^|\/)(?:trainings|goals)(?:\/|$)/.test(routePath);
}

export class OfflineInteractionPolicy {
    constructor(
        private readonly isOnline: boolean,
        private readonly pathname: string,
    ) {}

    isAllowed(surface: InteractionSurface, explicitlyAllowed?: boolean): boolean {
        if (this.isOnline) return true;
        if (surface === 'confirmation') return isTrainingsOrGoalsRoute(this.pathname);
        if (explicitlyAllowed !== undefined) return explicitlyAllowed;
        switch (surface) {
            case 'page':
                return isTrainingsOrGoalsRoute(this.pathname);
            case 'modal':
            case 'online':
            case 'profile-navigation':
                return false;
            case 'navigation':
                return true;
        }
    }

    isDisabled(surface: InteractionSurface, explicitlyAllowed?: boolean): boolean {
        return !this.isAllowed(surface, explicitlyAllowed);
    }
}
