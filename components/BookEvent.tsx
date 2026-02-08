'use client';

import {useState} from "react";
import {createBooking} from "@/lib/actions/booking.actions";
import posthog from "posthog-js";

const BookEvent = ({ eventId, slug }: { eventId: string, slug: string;}) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { success } = await createBooking({ eventId, slug, email });

            if(success) {
                setSubmitted(true);
                posthog.capture('event_booked', { eventId, slug, email })
            } else {
                setError('Booking failed. Please try again.');
                posthog.captureException('Booking creation failed')
            }
        } catch (err) {
            console.error('Booking creation failed', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm text-green-400">Thank you for signing up!</p>
            ): (
                <form onSubmit={handleSubmit}>
                    {error && (
                        <p className="text-red-400 text-sm mb-2">{error}</p>
                    )}
                    <div>
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            id="email"
                            placeholder="Enter your email address"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <button
                        type="submit"
                        className="button-submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                </form>
            )}
        </div>
    )
}
export default BookEvent