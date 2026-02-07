import {NextRequest, NextResponse} from "next/server";
import { v2 as cloudinary } from 'cloudinary';

import connectDB from "@/lib/mongodb";
import Event from '@/database/event.model';

// Allowed MIME types for image uploads
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validates the API key from request headers
 */
function validateApiKey(req: NextRequest): boolean {
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.API_SECRET_KEY;

    // If no API key is configured, allow requests (development mode)
    if (!apiKey) {
        console.warn('API_SECRET_KEY not configured - running in development mode');
        return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.substring(7);
    return token === apiKey;
}

export async function POST(req: NextRequest) {
    try {
        // Auth guard - check API key before any processing
        if (!validateApiKey(req)) {
            return NextResponse.json(
                { message: 'Unauthorized - Invalid or missing API key' },
                { status: 401 }
            );
        }

        const formData = await req.formData();

        // Validate image file first
        const file = formData.get('image') as File | null;

        if (!file) {
            return NextResponse.json(
                { message: 'Image file is required' },
                { status: 400 }
            );
        }

        // Validate file MIME type
        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { message: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { message: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        // Parse and validate tags
        const tagsRaw = formData.get('tags');
        if (!tagsRaw || typeof tagsRaw !== 'string' || tagsRaw.trim() === '') {
            return NextResponse.json(
                { message: 'Tags are required and must be a valid JSON array' },
                { status: 400 }
            );
        }

        let tags: string[];
        try {
            tags = JSON.parse(tagsRaw);
            if (!Array.isArray(tags)) {
                throw new Error('Tags must be an array');
            }
        } catch {
            return NextResponse.json(
                { message: 'Invalid tags format. Must be a valid JSON array' },
                { status: 400 }
            );
        }

        // Parse and validate agenda
        const agendaRaw = formData.get('agenda');
        if (!agendaRaw || typeof agendaRaw !== 'string' || agendaRaw.trim() === '') {
            return NextResponse.json(
                { message: 'Agenda is required and must be a valid JSON array' },
                { status: 400 }
            );
        }

        let agenda: string[];
        try {
            agenda = JSON.parse(agendaRaw);
            if (!Array.isArray(agenda)) {
                throw new Error('Agenda must be an array');
            }
        } catch {
            return NextResponse.json(
                { message: 'Invalid agenda format. Must be a valid JSON array' },
                { status: 400 }
            );
        }

        // Connect to database after validation passes
        await connectDB();

        // Build payload with explicit allowlist - only pick permitted fields
        const allowedFields = [
            'title', 'description', 'overview', 'venue', 'location',
            'date', 'time', 'mode', 'audience', 'organizer'
        ] as const;

        const eventPayload: Record<string, unknown> = {};
        for (const field of allowedFields) {
            const value = formData.get(field);
            if (value !== null && typeof value === 'string') {
                eventPayload[field] = value.trim();
            }
        }

        // Validate required fields
        const requiredFields = ['title', 'description', 'overview', 'venue', 'location', 'date', 'time', 'mode', 'audience', 'organizer'];
        for (const field of requiredFields) {
            if (!eventPayload[field]) {
                return NextResponse.json(
                    { message: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Upload image to Cloudinary
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { resource_type: 'image', folder: 'DevEvent' },
                (error, results) => {
                    if (error) return reject(error);
                    if (!results) return reject(new Error('Upload failed - no result'));
                    resolve(results as { secure_url: string });
                }
            ).end(buffer);
        });

        // Create event with validated and sanitized payload
        const createdEvent = await Event.create({
            ...eventPayload,
            image: uploadResult.secure_url,
            tags,
            agenda,
        });

        return NextResponse.json(
            { message: 'Event created successfully', event: createdEvent },
            { status: 201 }
        );
    } catch (e) {
        console.error('Event creation failed:', e);
        return NextResponse.json(
            { message: 'Event creation failed', error: 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        await connectDB();

        const events = await Event.find().sort({ createdAt: -1 });

        return NextResponse.json({ message: 'Events fetched successfully', events }, { status: 200 });
    } catch (e) {
        console.error('Event fetching failed:', e);
        return NextResponse.json(
            { message: 'Event fetching failed', error: e instanceof Error ? e.message : 'INTERNAL_ERROR' },
            { status: 500 }
        );
    }
}