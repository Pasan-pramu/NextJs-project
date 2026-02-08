import ExploreBtn from "@/components/ExploreBtn";
import EventCard from "@/components/EventCard";
import {IEventSerialized} from "@/database";
import {getAllEvents} from "@/lib/actions/event.actions";

const Page = async () => {

    // Use server action for direct DB access instead of self-fetching API
    let events: IEventSerialized[] = [];
    try {
        events = await getAllEvents();
    } catch (error) {
        console.error('Error fetching events:', error);
        // Return empty array on failure - will show "no events" state
    }

    return (
        <section>
            <h1 className="text-center">The Hub for Every Dev <br /> Event You Can&apos;t Miss</h1>
            <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>

            <ExploreBtn />

            <div className="mt-20 space-y-7">
                <h3>Featured Events</h3>

                <ul className="events">
                    {events && events.length > 0 && events.map((event: IEventSerialized) => (
                        <li key={event._id} className="list-none">
                            <EventCard {...event} />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}

export default Page;