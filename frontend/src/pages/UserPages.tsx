import {useParams} from 'react-router-dom';

export default function UserPages() {
    const {link} = useParams<{ link: string }>();
    return <div className="container mt-5"><h2>Strony użytkownika: {link}</h2><p className="text-muted">Lista stron i
        formularz dodawania (Tylko rola Organizator).</p></div>;
}