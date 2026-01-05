import { sendGAEvent } from '@next/third-parties/google';

type EventName =
    | 'quiz_start'
    | 'quiz_complete'
    | 'quiz_bookmark'
    | 'filter_change'
    | 'search'
    | 'share'
    | 'review_submit'
    | 'theme_change'
    | 'push_subscription'
    | 'ai_generation';

export const trackEvent = (eventName: EventName, params?: Record<string, any>) => {
    sendGAEvent('event', eventName, params || {});
};
