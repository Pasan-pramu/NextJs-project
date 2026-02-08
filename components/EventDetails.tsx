'use client';

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import BookEvent from '@/components/BookEvent';
import EventCard from '@/components/EventCard';
import { IEventSerialized } from '@/database';
import { getEventBySlug, getSimilarEventsBySlug, getBookingsCount } from '@/lib/actions/event.actions';

interface EventDetailsProps {
    params: Promise<string>;
}

const EventDetails = ({ params }: EventDetailsProps) => {
    const slug = use(params);
    const [event, setEvent] = useState<IEventSerialized | null>(null);
    const [similarEvents, setSimilarEvents] = useState<IEventSerialized[]>([]);
    const [bookingsCount, setBookingsCount] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventData, similar, count] = await Promise.all([
                    getEventBySlug(slug),
                    getSimilarEventsBySlug(slug),
                    getBookingsCount(slug)
                ]);

                setEvent(eventData);
                setSimilarEvents(similar);
                setBookingsCount(count);
            } catch (error) {
                console.error('Error fetching event:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [slug]);

    if (loading) {
        return (
            <section id="event">
                <div className="flex items-center justify-center min-h-[50vh]">
                    <p className="text-light-100 text-lg">Loading event...</p>
                </div>
            </section>
        );
    }

    if (!event) {
        notFound();
    }

    return (
        <section id="event">
            <div className="header">
                <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                        <span key={tag} className="pill">{tag}</span>
                    ))}
                </div>
                <h1>{event.title}</h1>
                <p>{event.description}</p>
            </div>

            <div className="details">
                <div className="content">
                    <Image
                        src={event.image}
                        alt={event.title}
                        width={800}
                        height={457}
                        className="banner"
                        unoptimized={event.image.startsWith('data:')}
                    />

                    <div className="flex-col-gap-2">
                        <h2>About Event</h2>
                        <p>{event.overview}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex-row-gap-2">
                            <Image src="/icons/calendar.svg" alt="date" width={20} height={20} />
                            <div>
                                <p className="text-light-200 text-sm">Date</p>
                                <p className="text-white">{event.date}</p>
                            </div>
                        </div>
                        <div className="flex-row-gap-2">
                            <Image src="/icons/clock.svg" alt="time" width={20} height={20} />
                            <div>
                                <p className="text-light-200 text-sm">Time</p>
                                <p className="text-white">{event.time}</p>
                            </div>
                        </div>
                        <div className="flex-row-gap-2">
                            <Image src="/icons/pin.svg" alt="location" width={20} height={20} />
                            <div>
                                <p className="text-light-200 text-sm">Location</p>
                                <p className="text-white">{event.location}</p>
                            </div>
                        </div>
                        <div className="flex-row-gap-2">
                            <Image src="/icons/mode.svg" alt="mode" width={20} height={20} />
                            <div>
                                <p className="text-light-200 text-sm">Mode</p>
                                <p className="text-white capitalize">{event.mode}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-col-gap-2">
                        <h2>Venue</h2>
                        <p>{event.venue}</p>
                    </div>

                    <div className="flex-col-gap-2">
                        <h2>Audience</h2>
                        <div className="flex-row-gap-2">
                            <Image src="/icons/audience.svg" alt="audience" width={20} height={20} />
                            <p>{event.audience}</p>
                        </div>
                    </div>

                    <div className="agenda">
                        <h2>Agenda</h2>
                        <ul>
                            {event.agenda.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="booking">
                    <div className="signup-card">
                        <h2>Sign up for the Event</h2>
                        <p className="text-light-200 text-sm">
                            {bookingsCount} {bookingsCount === 1 ? 'person has' : 'people have'} signed up
                        </p>
                        <BookEvent eventId={event._id} slug={slug} />
                    </div>
                </div>
            </div>

            {similarEvents.length > 0 && (
                <div className="mt-20 space-y-7">
                    <h3>Similar Events</h3>
                    <ul className="events">
                        {similarEvents.map((similarEvent) => (
                            <li key={similarEvent._id} className="list-none">
                                <EventCard {...similarEvent} />
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
};

export default EventDetails;

