import {PageFollowResponse} from './PageFollowResponse';
import {PageParticipantResponse} from './PageParticipantResponse';

export class PageResponse {
    id!: string;
    createdAt!: string;
    updatedAt!: string;
    title!: string;
    description!: string;
    link!: string;
    profilePhoto!: string;
    backgroundPhoto!: string;
    color!: number;
    status!: number;
    follows!: PageFollowResponse[];
    participants!: PageParticipantResponse[];
}