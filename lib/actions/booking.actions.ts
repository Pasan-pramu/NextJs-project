'use server';

import Booking from '@/database/booking.model';
import Event from '@/database/event.model';
import connectDB from "@/lib/mongodb";

export interface CreateBookingResult {
    success: boolean;
    message: string;
}

/**
 * Creates a new booking for an event
 * @param slug - The event slug
 * @param email - The user's email address
 * @returns Result object with success status and message
 */
export const createBooking = async (slug: string, email: string): Promise<CreateBookingResult> => {
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return {
                success: false,
                message: 'Please provide a valid email address',
            };
        }

        await connectDB();

        // Find the event by slug
        const event = await Event.findOne({ slug }).select('_id').lean();
        if (!event) {
            return {
                success: false,
                message: 'Event not found',
            };
        }

        // Check if booking already exists for this email and event
        const existingBooking = await Booking.findOne({
            eventId: event._id,
            email: email.toLowerCase().trim(),
        });

        if (existingBooking) {
            return {
                success: false,
                message: 'You have already booked this event',
            };
        }

        // Create the booking
        await Booking.create({
            eventId: event._id,
            email: email.toLowerCase().trim(),
        });

        return {
            success: true,
            message: 'Successfully booked! Check your email for confirmation.',
        };
    } catch (error) {
        console.error('Error creating booking:', error);
        return {
            success: false,
            message: 'Failed to create booking. Please try again.',
        };
    }
};

