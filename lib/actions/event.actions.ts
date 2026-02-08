'use server';

import Event from '@/database/event.model';
import Booking from '@/database/booking.model';
import type { IEventLean } from '@/database';
import connectDB from "@/lib/mongodb";
import { revalidatePath } from 'next/cache';

// Define the input type for creating an event
export interface CreateEventInput {
    title: string;
    description: string;
    overview: string;
    image: string;
    venue: string;
    location: string;
    date: string;
    time: string;
    mode: 'online' | 'offline' | 'hybrid';
    audience: string;
    organizer: string;
    tags: string[];
    agenda: string[];
}

/**
 * Creates a new event
 * @param eventData - The event data
 * @returns The created event or error
 */
export const createEvent = async (eventData: CreateEventInput): Promise<{ success: boolean; event?: IEventLean; error?: string }> => {
    try {
        await connectDB();

        // Validate required fields
        const requiredFields: (keyof CreateEventInput)[] = [
            'title', 'description', 'overview', 'image', 'venue',
            'location', 'date', 'time', 'mode', 'audience', 'organizer'
        ];

        for (const field of requiredFields) {
            if (!eventData[field]) {
                return { success: false, error: `Missing required field: ${field}` };
            }
        }

        // Validate arrays
        if (!eventData.tags || eventData.tags.length === 0) {
            return { success: false, error: 'At least one tag is required' };
        }

        if (!eventData.agenda || eventData.agenda.length === 0) {
            return { success: false, error: 'At least one agenda item is required' };
        }

        // Validate mode
        if (!['online', 'offline', 'hybrid'].includes(eventData.mode)) {
            return { success: false, error: 'Mode must be online, offline, or hybrid' };
        }

        const createdEvent = await Event.create(eventData);

        // Revalidate the home page and events page to show the new event
        revalidatePath('/');
        revalidatePath('/events');

        // Convert to plain object for client
        const eventLean = createdEvent.toObject() as IEventLean;

        return { success: true, event: eventLean };
    } catch (error) {
        console.error('Error creating event:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create event'
        };
    }
};

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
