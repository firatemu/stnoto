/**
 * Global Event Hub for cross-tab and cross-component synchronization.
 * Uses BroadcastChannel API to notify other parts of the application about data changes.
 */

type EventName = 'cari:updated' | 'fatura:updated' | 'stok:updated' | 'tahsilat:updated';

const CHANNEL_NAME = 'stnoto_data_sync';

// Check if we are in the browser
const isBrowser = typeof window !== 'undefined';

const channel = isBrowser ? new BroadcastChannel(CHANNEL_NAME) : null;

export const eventHub = {
    /**
     * Emit an event to all tabs and the current tab
     */
    emit: (event: EventName, data?: any) => {
        if (!isBrowser) return;

        // Send to other tabs
        channel?.postMessage({ event, data });

        // Also trigger on the current tab using native CustomEvent
        const customEvent = new CustomEvent(CHANNEL_NAME, { detail: { event, data } });
        window.dispatchEvent(customEvent);
    },

    /**
     * Listen for an event (from any tab)
     */
    on: (event: EventName, callback: (data?: any) => void) => {
        if (!isBrowser) return () => { };

        const handleMessage = (e: MessageEvent) => {
            if (e.data?.event === event) {
                callback(e.data.data);
            }
        };

        const handleCustomEvent = (e: any) => {
            if (e.detail?.event === event) {
                callback(e.detail.data);
            }
        };

        channel?.addEventListener('message', handleMessage);
        window.addEventListener(CHANNEL_NAME, handleCustomEvent);

        // Return unsubscribe function
        return () => {
            channel?.removeEventListener('message', handleMessage);
            window.removeEventListener(CHANNEL_NAME, handleCustomEvent);
        };
    }
};
