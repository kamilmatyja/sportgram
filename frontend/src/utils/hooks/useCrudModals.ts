import { useFormState } from './useFormState';
import { useModal } from './useModal';

export function useCrudModals<T>(onSuccess: () => void) {
    const addModal = useModal();
    const manageModal = useModal<T>();
    const formState = useFormState();

    const submitAdd = (action: () => Promise<unknown>) =>
        formState
            .wrap(async () => {
                await action();
                addModal.close();
                onSuccess();
            })
            .catch(() => {});

    const submitManage = async (action: (item: T) => Promise<unknown>, afterSuccess: () => void = onSuccess) => {
        const item = manageModal.data;
        if (!item) return;
        await formState
            .wrap(async () => {
                await action(item);
                manageModal.close();
                afterSuccess();
            })
            .catch(() => {});
    };

    return { addModal, manageModal, ...formState, submitAdd, submitManage };
}
