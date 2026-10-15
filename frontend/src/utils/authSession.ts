export const UNCONFIRMED_ACCOUNT_ERROR = 'User account is not confirmed.';

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

const TOKEN_KEY = 'token';
const SIGN_ID_KEY = 'success_sign_id';

function activeStorage(): Storage {
    return localStorage.getItem(SIGN_ID_KEY) ? localStorage : sessionStorage;
}

export const authStorage = {
    getToken: () => activeStorage().getItem(TOKEN_KEY),
    getSignId: () => activeStorage().getItem(SIGN_ID_KEY),
    save: (token: string, signId: string, rememberMe: boolean) => {
        authStorage.clear();
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(SIGN_ID_KEY, signId);
    },
    setToken: (token: string) => activeStorage().setItem(TOKEN_KEY, token),
    clear: () => {
        [localStorage, sessionStorage].forEach((storage) => {
            storage.removeItem(TOKEN_KEY);
            storage.removeItem(SIGN_ID_KEY);
        });
    },
};
