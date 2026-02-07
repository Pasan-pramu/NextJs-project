import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEventLean} from "@/database";
import {getAllEvents} from "@/lib/actions/event.actions";
import {cacheLife} from "next/cache";

const Page = async () => {
    'use cache';
    cacheLife('hours')

    // Use server action for direct DB access instead of self-fetching API
    let events: IEventLean[] = [];
    try {
        events = await getAllEvents();
    } catch (error) {
        console.error('Error fetching events:', error);
        // Return empty array on failure - will show "no events" state
    }

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEventLean) => (
                        <li key={String(event._id)} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Page;