type AuthFlow = 'sign' | 'register' | 'password_reset';
type AuthSessionKey = 'email' | 'password' | 'rememberMe';

const SESSION_KEYS = ['step', 'id', 'email', 'password', 'rememberMe'];

export function authSession(flow: AuthFlow) {
    const key = (name: string) => `${flow}_${name}`;

    return {
        step: () => Number(sessionStorage.getItem(key('step'))) || 1,
        id: () => sessionStorage.getItem(key('id')),
        get: (name: AuthSessionKey) => sessionStorage.getItem(key(name)) || '',
        start: (id: string, data: Partial<Record<AuthSessionKey, string>> = {}) => {
            sessionStorage.setItem(key('step'), '2');
            sessionStorage.setItem(key('id'), id);
            Object.entries(data).forEach(([name, value]) => sessionStorage.setItem(key(name), value));
        },
        clear: () => SESSION_KEYS.forEach((name) => sessionStorage.removeItem(key(name))),
    };
}

export const signSession = authSession('sign');
export const registerSession = authSession('register');
export const passwordResetSession = authSession('password_reset');
export const UNCONFIRMED_ACCOUNT_ERROR = 'User account is not confirmed.';
