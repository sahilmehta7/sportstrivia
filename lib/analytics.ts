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
    | 'ai_generation'
    | 'grid_start'
    | 'grid_correct'
    | 'grid_wrong'
    | 'grid_cell_opened'
    | 'grid_cell_submitted'
    | 'grid_completed'
    | 'grid_result_shared'
    | 'share_click_copy'
    | 'account_delete_viewed'
    | 'account_delete_export_clicked'
    | 'account_delete_confirmed'
    | 'account_delete_succeeded'
    | 'account_delete_failed'
    | 'pre_onboarding_viewed'
    | 'pre_onboarding_step_viewed'
    | 'pre_onboarding_skipped'
    | 'pre_onboarding_completed'
    | 'pre_onboarding_cta_clicked';

export const trackEvent = (eventName: EventName, params?: Record<string, any>) => {
    sendGAEvent('event', eventName, params || {});
};
