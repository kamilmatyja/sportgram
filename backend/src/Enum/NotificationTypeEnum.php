<?php

namespace App\Enum;

use App\Trait\EnumValuesTrait;

enum NotificationTypeEnum: int
{
    use EnumValuesTrait;

    case Conversation = 1;
    case Event = 2;
    case EventStatus = 3;
    case EventList = 4;
    case EventListStatus = 5;
    case EventResult = 6;
    case FeedStatus = 7;
    case FeedComment = 8;
    case FeedCommentStatus = 9;
    case FeedReaction = 10;
    case FeedReactionStatus = 11;
    case Friend = 12;
    case FriendStatus = 13;
    case GoalParticipant = 14;
    case GoalParticipantStatus = 15;
    case GoalResult = 16;
    case GoalResultStatus = 17;
    case GoalStatus = 18;
    case PageParticipant = 19;
    case PageParticipantStatus = 20;
    case PageFollow = 21;
    case PageFollowStatus = 22;
    case PageStatus = 23;
    case StoryStatus = 24;
    case TrainingParticipant = 25;
    case TrainingParticipantStatus = 26;
    case TrainingStatus = 27;
    case UserStatus = 28;
}
