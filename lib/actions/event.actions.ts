'use server';

import Event from '@/database/event.model';
import Booking from '@/database/booking.model';
import type { IEventLean } from '@/database';
import connectDB from "@/lib/mongodb";

/**
 * Fetches a single event by its slug
 * @param slug - The event slug
 * @returns The event object or null if not found
 */
export const getEventBySlug = async (slug: string): Promise<IEventLean | null> => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).lean<IEventLean>();
        return event;
    } catch (error) {
        console.error('Error fetching event by slug:', error);
        return null;
    }
};

/**
 * Gets the booking count for a specific event
 * @param slug - The event slug
 * @returns The number of bookings for the event
 */
export const getBookingsCount = async (slug: string): Promise<number> => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug }).select('_id').lean();
        if (!event) return 0;

        const count = await Booking.countDocuments({ eventId: event._id });
        return count;
    } catch (error) {
        console.error('Error fetching bookings count:', error);
        return 0;
    }
};

export const getSimilarEventsBySlug = async (slug: string): Promise<IEventLean[]> => {
    try {
        await connectDB();
        const event = await Event.findOne({ slug });

        if (!event) return [];

        return await Event.find({ _id: { $ne: event._id }, tags: { $in: event.tags } }).lean<IEventLean[]>();
    } catch {
        return [];
    }
}

/**
 * Fetches all events sorted by creation date (newest first)
 * @returns Array of all events
 */
export const getAllEvents = async (): Promise<IEventLean[]> => {
    try {
        await connectDB();
        const events = await Event.find().sort({ createdAt: -1 }).lean<IEventLean[]>();
        return events;
    } catch (error) {
        console.error('Error fetching all events:', error);
        return [];
    }
};
