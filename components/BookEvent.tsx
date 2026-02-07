'use client';

import {useState} from "react";
import {createBooking} from "@/lib/actions/booking.actions";

interface BookEventProps {
    slug: string;
}

const BookEvent = ({ slug }: BookEventProps) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Guard against duplicate submissions
        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await createBooking(slug, email);

            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.message);
            }
        } catch {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div id="book-event">
            {submitted ? (
                <p className="text-sm">Thank you for signing up!</p>
            ): (
                <form onSubmit={handleSubmit}>
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

                    {error && (
                        <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}

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