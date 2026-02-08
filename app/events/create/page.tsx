'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createEvent, CreateEventInput } from '@/lib/actions/event.actions';

const CreateEventPage = () => {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        overview: '',
        venue: '',
        location: '',
        date: '',
        time: '',
        mode: 'offline' as 'online' | 'offline' | 'hybrid',
        audience: '',
        organizer: '',
        tags: '',
        agenda: '',
    });

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
                setError('Invalid image type. Please use JPEG, PNG, WebP, or GIF.');
                return;
            }
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setError('Image too large. Maximum size is 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError(null);

        try {
            // Parse tags and agenda from comma-separated strings
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            const agenda = formData.agenda.split('\n').map(item => item.trim()).filter(item => item !== '');

            if (tags.length === 0) {
                setError('Please add at least one tag');
                setIsSubmitting(false);
                return;
            }

            if (agenda.length === 0) {
                setError('Please add at least one agenda item');
                setIsSubmitting(false);
                return;
            }

            if (!imagePreview) {
                setError('Please select an image');
                setIsSubmitting(false);
                return;
            }

            const eventData: CreateEventInput = {
                title: formData.title,
                description: formData.description,
                overview: formData.overview,
                image: imagePreview, // Using base64 for simplicity - in production use Cloudinary
                venue: formData.venue,
                location: formData.location,
                date: formData.date,
                time: formData.time,
                mode: formData.mode,
                audience: formData.audience,
                organizer: formData.organizer,
                tags,
                agenda,
            };

            const result = await createEvent(eventData);

            if (result.success) {
                router.push('/');
                router.refresh();
            } else {
                setError(result.error || 'Failed to create event');
            }
        } catch (err) {
            console.error('Error creating event:', err);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="create-event" className="max-w-4xl mx-auto">
            <h1 className="text-center mb-10">Create New Event</h1>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="text-light-100 font-semibold">
                        Event Title *
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., React Summit 2026"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                    />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="text-light-100 font-semibold">
                        Short Description *
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                        rows={2}
                        placeholder="A brief description of the event"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white resize-none"
                    />
                </div>

                {/* Overview */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="overview" className="text-light-100 font-semibold">
                        Event Overview *
                    </label>
                    <textarea
                        id="overview"
                        name="overview"
                        value={formData.overview}
                        onChange={handleInputChange}
                        required
                        rows={4}
                        placeholder="Detailed description of what the event is about"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white resize-none"
                    />
                </div>

                {/* Image Upload */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="image" className="text-light-100 font-semibold">
                        Event Image *
                    </label>
                    <input
                        type="file"
                        id="image"
                        name="image"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary file:text-black file:font-semibold file:cursor-pointer"
                    />
                    {imagePreview && (
                        <div className="mt-3">
                            <Image
                                src={imagePreview}
                                alt="Preview"
                                width={300}
                                height={200}
                                className="rounded-lg object-cover"
                            />
                        </div>
                    )}
                </div>

                {/* Venue and Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="venue" className="text-light-100 font-semibold">
                            Venue *
                        </label>
                        <input
                            type="text"
                            id="venue"
                            name="venue"
                            value={formData.venue}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., Moscone Center"
                            className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="location" className="text-light-100 font-semibold">
                            Location *
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            placeholder="e.g., San Francisco, CA, USA"
                            className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                        />
                    </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="date" className="text-light-100 font-semibold">
                            Date *
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                            required
                            className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label htmlFor="time" className="text-light-100 font-semibold">
                            Time *
                        </label>
                        <input
                            type="time"
                            id="time"
                            name="time"
                            value={formData.time}
                            onChange={handleInputChange}
                            required
                            className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                        />
                    </div>
                </div>

                {/* Mode */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="mode" className="text-light-100 font-semibold">
                        Event Mode *
                    </label>
                    <select
                        id="mode"
                        name="mode"
                        value={formData.mode}
                        onChange={handleInputChange}
                        required
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                    >
                        <option value="offline">Offline (In-Person)</option>
                        <option value="online">Online (Virtual)</option>
                        <option value="hybrid">Hybrid</option>
                    </select>
                </div>

                {/* Audience */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="audience" className="text-light-100 font-semibold">
                        Target Audience *
                    </label>
                    <input
                        type="text"
                        id="audience"
                        name="audience"
                        value={formData.audience}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Developers, Designers, Entrepreneurs"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                    />
                </div>

                {/* Organizer */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="organizer" className="text-light-100 font-semibold">
                        Organizer *
                    </label>
                    <input
                        type="text"
                        id="organizer"
                        name="organizer"
                        value={formData.organizer}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., Tech Events Inc."
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                    />
                </div>

                {/* Tags */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="tags" className="text-light-100 font-semibold">
                        Tags * <span className="text-light-200 font-normal text-sm">(comma separated)</span>
                    </label>
                    <input
                        type="text"
                        id="tags"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., React, JavaScript, Frontend, Web Development"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white"
                    />
                </div>

                {/* Agenda */}
                <div className="flex flex-col gap-2">
                    <label htmlFor="agenda" className="text-light-100 font-semibold">
                        Agenda * <span className="text-light-200 font-normal text-sm">(one item per line)</span>
                    </label>
                    <textarea
                        id="agenda"
                        name="agenda"
                        value={formData.agenda}
                        onChange={handleInputChange}
                        required
                        rows={5}
                        placeholder="9:00 AM - Registration&#10;10:00 AM - Opening Keynote&#10;11:00 AM - Workshop Session&#10;12:00 PM - Lunch Break"
                        className="bg-dark-200 rounded-[6px] px-5 py-2.5 text-white resize-none"
                    />
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-primary hover:bg-primary/90 w-full cursor-pointer items-center justify-center rounded-[6px] px-4 py-3 text-lg font-semibold text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isSubmitting ? 'Creating Event...' : 'Create Event'}
                </button>
            </form>
        </section>
    );
};

export default CreateEventPage;

